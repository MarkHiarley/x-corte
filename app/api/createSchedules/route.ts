import { NextRequest, NextResponse } from 'next/server';
import { scheduleService } from '../../services/scheduleService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validação básica
    if (!body.enterpriseEmail || !body.name || !body.timeZone || !body.availability) {
      return NextResponse.json({
        success: false,
        message: 'Dados obrigatórios: enterpriseEmail, name, timeZone, availability'
      }, { status: 400 });
    }

    // Criar schedule no Firestore para a empresa
    const result = await scheduleService.createSchedule(
      body.enterpriseEmail,
      {
        name: body.name,
        timeZone: body.timeZone,
        availability: body.availability,
        isDefault: body.isDefault || false
      }
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: 'data' in result ? result.data : null,
        message: 'Schedule criado com sucesso no Firebase!'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'error' in result ? result.error : 'Erro desconhecido'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Erro na API:', error);
    
    return NextResponse.json({
      success: false,
      message: error.message || 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}
