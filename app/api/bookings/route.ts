import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '../../services/bookingService';

// GET /api/bookings?enterpriseEmail=email&date=2025-08-23&status=pending - Listar agendamentos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const enterpriseEmail = searchParams.get('enterpriseEmail');
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    
    if (!enterpriseEmail) {
      return NextResponse.json({
        success: false,
        message: 'enterpriseEmail é obrigatório'
      }, { status: 400 });
    }
    
    const result = await bookingService.getBookings(enterpriseEmail, date || undefined, status || undefined);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: 'data' in result ? result.data : []
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'error' in result ? result.error : 'Erro desconhecido'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Erro na API de agendamentos:', error);
    
    return NextResponse.json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// POST /api/bookings - Criar agendamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validação básica
    const requiredFields = ['enterpriseEmail', 'clientName', 'clientPhone', 'productId', 'date', 'startTime'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          message: `Campo obrigatório: ${field}`
        }, { status: 400 });
      }
    }

    // Validar formato da data (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.date)) {
      return NextResponse.json({
        success: false,
        message: 'Data deve estar no formato YYYY-MM-DD'
      }, { status: 400 });
    }

    // Validar formato do horário (HH:MM)
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(body.startTime)) {
      return NextResponse.json({
        success: false,
        message: 'Horário deve estar no formato HH:MM'
      }, { status: 400 });
    }

    // Criar agendamento no Firestore
    const result = await bookingService.createBooking(
      body.enterpriseEmail,
      {
        clientName: body.clientName,
        clientPhone: body.clientPhone,
        clientEmail: body.clientEmail || '',
        productId: body.productId,
        date: body.date,
        startTime: body.startTime,
        notes: body.notes || '',
        // Campos que serão preenchidos automaticamente pelo service
        productName: '',
        productDuration: 0,
        productPrice: 0,
        status: 'pending' as const
      }
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: 'data' in result ? result.data : null,
        message: 'Agendamento criado com sucesso!'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'error' in result ? result.error : 'Erro desconhecido'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Erro na API de agendamentos:', error);
    
    return NextResponse.json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}
