import { NextRequest, NextResponse } from 'next/server';
import { scheduleService } from '../../../services/scheduleService';

// GET /api/schedules/[id]?enterpriseEmail=email - Buscar schedule por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const enterpriseEmail = searchParams.get('enterpriseEmail');
    
    if (!enterpriseEmail) {
      return NextResponse.json({
        success: false,
        message: 'enterpriseEmail é obrigatório'
      }, { status: 400 });
    }
    
    const result = await scheduleService.getScheduleById(enterpriseEmail, id);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: 'data' in result ? result.data : null
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'error' in result ? result.error : 'Erro desconhecido'
      }, { status: 404 });
    }
  } catch (error: any) {
    console.error('Erro na API:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// PUT /api/schedules/[id]?enterpriseEmail=email - Atualizar schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const enterpriseEmail = searchParams.get('enterpriseEmail');
    
    if (!enterpriseEmail) {
      return NextResponse.json({
        success: false,
        message: 'enterpriseEmail é obrigatório'
      }, { status: 400 });
    }
    
    const body = await request.json();
    
    const result = await scheduleService.updateSchedule(enterpriseEmail, id, body);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: 'data' in result ? result.data : null,
        message: 'Schedule atualizado com sucesso'
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
      message: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// DELETE /api/schedules/[id]?enterpriseEmail=email - Deletar schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const enterpriseEmail = searchParams.get('enterpriseEmail');
    
    if (!enterpriseEmail) {
      return NextResponse.json({
        success: false,
        message: 'enterpriseEmail é obrigatório'
      }, { status: 400 });
    }
    
    const result = await scheduleService.deleteSchedule(enterpriseEmail, id);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'message' in result ? result.message : 'Schedule deletado com sucesso'
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
      message: 'Erro interno do servidor'
    }, { status: 500 });
  }
}
