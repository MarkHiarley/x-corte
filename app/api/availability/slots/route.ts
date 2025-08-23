import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '../../../services/bookingService';

// GET /api/availability/slots?enterpriseEmail=email&date=2025-08-23&duration=30 - Verificar slots disponíveis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const enterpriseEmail = searchParams.get('enterpriseEmail');
    const date = searchParams.get('date');
    const duration = searchParams.get('duration');
    
    // Validações
    if (!enterpriseEmail) {
      return NextResponse.json({
        success: false,
        message: 'enterpriseEmail é obrigatório'
      }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({
        success: false,
        message: 'date é obrigatório (formato: YYYY-MM-DD)'
      }, { status: 400 });
    }

    if (!duration) {
      return NextResponse.json({
        success: false,
        message: 'duration é obrigatório (em minutos)'
      }, { status: 400 });
    }

    // Validar formato da data
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json({
        success: false,
        message: 'Data deve estar no formato YYYY-MM-DD'
      }, { status: 400 });
    }

    // Validar duração
    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Duração deve ser um número positivo'
      }, { status: 400 });
    }
    
    const result = await bookingService.getAvailableSlots(enterpriseEmail, date, durationNum);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data || [],
        message: `${(result.data || []).length} slots disponíveis encontrados`
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.error || 'Erro desconhecido'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Erro na API de disponibilidade:', error);
    
    return NextResponse.json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}
