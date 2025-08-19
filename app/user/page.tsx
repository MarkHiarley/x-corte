import TopBar from "../components/topBar";
import PromoDiv from "../components/promoDiv";
import Services from "../components/services";
import Profissional from "../components/profisisonal";
export default function adminPage() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-start bg-[#ffffff] ">
      <TopBar />
      <PromoDiv />
      <Services />
      <Profissional />
    </div>
  );
};