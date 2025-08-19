const Profissional = () => {
    return (
        <div className="w-10/12 pt-6 h-4/12">
            <div className="flex flex-row justify-between ">
                <div className="text-2xl flex flex-col">
                    <p className="">Nossos</p>
                    <p className="font-bold">Profissionais</p>
                </div>
                <button className="cursor-pointer azullink">    
                    Ver Todos
                </button>
            </div>
            <div className="flex flex-row justify-between pt-4">
                <div className="border-2 border-gray-200 rounded-lg p-4 w-3/10 h-30">
                    Profissional 1
                </div>
                <div className="border-2 border-gray-200 rounded-lg p-4 w-3/10">
                    Profissional 2
                </div>
                <div className="border-2 border-gray-200 rounded-lg p-4 w-3/10 ">
                    Profissional 3
                </div>
            </div>
        </div>
    );
}

export default Profissional;
