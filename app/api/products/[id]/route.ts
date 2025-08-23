import { NextRequest, NextResponse } from 'next/server';
import { productService } from '../../../services/productService';

// GET /api/products/[id]?enterpriseEmail=email - Buscar produto por ID
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
    
    const result = await productService.getProductById(enterpriseEmail, id);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: 'data' in result ? result.data : null
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'error' in result ? result.error : 'Produto não encontrado'
      }, { status: 404 });
    }
  } catch (error: any) {
    console.error('Erro na API de produtos:', error);
    
    return NextResponse.json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// PUT /api/products/[id]?enterpriseEmail=email - Atualizar produto
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
    
    const result = await productService.updateProduct(enterpriseEmail, id, body);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Produto atualizado com sucesso'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'error' in result ? result.error : 'Erro desconhecido'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Erro na API de produtos:', error);
    
    return NextResponse.json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// DELETE /api/products/[id]?enterpriseEmail=email - Deletar produto
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
    
    const result = await productService.deleteProduct(enterpriseEmail, id);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Produto removido com sucesso'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'error' in result ? result.error : 'Erro desconhecido'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Erro na API de produtos:', error);
    
    return NextResponse.json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}
