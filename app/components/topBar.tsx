import { IoIosNotificationsOutline } from "react-icons/io";
const TopBar = () => {
    return (
        <div className="flex items-center justify-between p-4 w-full">
            <h1 className="text-3xl font-museu-modern">Corte</h1>
            <div className="text-4xl cursor-pointer rounded-lg bg-gray-50 p-2 text-gray-600">
                <IoIosNotificationsOutline />
            </div>
        </div>
    );
}

export default TopBar;
