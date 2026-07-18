import NavbarItem from "@/components/navbar/navbar_item";
import { useParams } from "react-router-dom";
import CustomerItems from "./components/CustomerItems";

const CustomerDetails = () => {
  const { id } = useParams();
  return (
    <div className="flex flex-col gap-4">
      <NavbarItem title="Customer Details" isBack />
      <CustomerItems id={id}/>
    </div>
  );
};

export default CustomerDetails;
