


const PromoDiv = () => {

    // fazer uma funcao para pegar o desconto do banco de dados das promocoes

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