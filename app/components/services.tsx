const Services = () => {
    return (
        <div className="w-10/12 pt-6 h-4/12">
            <div className="flex flex-row justify-between ">
                <div className="text-2xl flex flex-col">
                    <p className="">Nossos</p>
                    <p className="font-bold">Serviços</p>
                </div>
                <button className="cursor-pointer azullink">
                    Ver Todos
                </button>
            </div>
            <div className="flex flex-row justify-between pt-4">
                <div className="border-2 border-gray-200 rounded-lg p-4 w-3/10 h-30">
                    Serviço 1
                </div>
                <div className="border-2 border-gray-200 rounded-lg p-4 w-3/10">
                    Serviço 2
                </div>
                <div className="border-2 border-gray-200 rounded-lg p-4 w-3/10 ">
                    Serviço 3
                </div>
            </div>
        </div>
    );
}

export default Services;
