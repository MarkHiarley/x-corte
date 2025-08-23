import { NextRequest, NextResponse } from 'next/server';
import { productService } from '../../services/productService';

// GET /api/products?enterpriseEmail=email - Listar produtos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const enterpriseEmail = searchParams.get('enterpriseEmail');
    
    if (!enterpriseEmail) {
      return NextResponse.json({
        success: false,
        message: 'enterpriseEmail é obrigatório'
      }, { status: 400 });
    }
    
    const result = await productService.getProducts(enterpriseEmail);
    
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
    console.error('Erro na API de produtos:', error);
    
    return NextResponse.json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// POST /api/products - Criar produto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validação básica
    if (!body.enterpriseEmail || !body.name || !body.price || !body.duration) {
      return NextResponse.json({
        success: false,
        message: 'Dados obrigatórios: enterpriseEmail, name, price, duration'
      }, { status: 400 });
    }

    // Validar tipos
    if (typeof body.price !== 'number' || body.price <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Preço deve ser um número maior que zero (em centavos)'
      }, { status: 400 });
    }

    if (typeof body.duration !== 'number' || body.duration <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Duração deve ser um número maior que zero (em minutos)'
      }, { status: 400 });
    }

    // Criar produto no Firestore
    const result = await productService.createProduct(
      body.enterpriseEmail,
      {
        name: body.name,
        price: body.price,
        duration: body.duration,
        description: body.description || '',
        category: body.category || '',
        isActive: body.isActive !== undefined ? body.isActive : true
      }
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: 'data' in result ? result.data : null,
        message: 'Produto criado com sucesso!'
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
