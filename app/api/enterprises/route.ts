import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { collection, doc, setDoc, getDocs, getDoc } from 'firebase/firestore';

// POST /api/enterprises - Criar empresa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validação básica
    if (!body.email || !body.name) {
      return NextResponse.json({
        success: false,
        message: 'Email e nome são obrigatórios'
      }, { status: 400 });
    }

    // Dados da empresa
    const enterpriseData = {
      email: body.email,
      name: body.name,
      phone: body.phone || '',
      address: body.address || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Criar empresa no Firestore usando o email como ID
    const enterpriseRef = doc(db, 'enterprises', body.email);
    await setDoc(enterpriseRef, enterpriseData);

    return NextResponse.json({
      success: true,
      data: enterpriseData,
      message: 'Empresa criada com sucesso!'
    });

  } catch (error: any) {
    console.error('Erro ao criar empresa:', error);
    
    return NextResponse.json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// GET /api/enterprises - Listar empresas
export async function GET() {
  try {
    const enterprisesRef = collection(db, 'enterprises');
    const snapshot = await getDocs(enterprisesRef);
    
    const enterprises = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: enterprises
    });

  } catch (error: any) {
    console.error('Erro ao buscar empresas:', error);
    
    return NextResponse.json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}
