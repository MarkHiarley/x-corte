


const PromoDiv = () => {

    // fazer uma verificação para ver se ta logado como admin ou user e se admin por uma opcao de editar a promoção

    return (
        <div className="w-10/12 h-3/12 bg-[#0E4587] rounded-lg text-white flex flex-col justify-center p-4 ">
            <p>25%</p>
            <p className="text-2xl pb-4">Today’s Special</p>
            <p>Get a discount for every services order!
                Only valid for today!</p>
        </div>
    );
}

export default PromoDiv;