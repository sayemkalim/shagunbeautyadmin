import { useEffect, useState, useRef } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOrders } from "@/pages/orders/helpers/fetchOrders";
import { playLoudRingtone, initAudioUnlock } from "@/utils/sound";
import { toast } from "sonner";

const Layout = () => {
  const queryClient = useQueryClient();
  
  // Track last play time to prevent overlapping and respect the 2-minute reminder interval
  const lastPlayTimeRef = useRef(0);

  // Initialize the audio unlock listener to bypass browser autoplay policy
  useEffect(() => {
    initAudioUnlock();
  }, []);
  
  const triggerRingtone = () => {
    console.log("Triggering loud order notification ringtone (3 times)");
    playLoudRingtone(3);
    lastPlayTimeRef.current = Date.now();
  };

  const [lastOrderTime, setLastOrderTime] = useState(() => {
    const saved = localStorage.getItem("last_order_time");
    return saved ? parseInt(saved, 10) : null;
  });
  const hasInitialized = useRef(false);

  // Poll for the 5 latest orders every 15 seconds (detect new orders immediately)
  const { data: latestOrdersRes } = useQuery({
    queryKey: ["latest-orders-poll"],
    queryFn: () => fetchOrders({ params: { page: 1, per_page: 5 } }),
    refetchInterval: 15000, // 15 seconds
    refetchIntervalInBackground: true,
  });

  // New Order detection and immediate alert
  useEffect(() => {
    const orders = latestOrdersRes?.response?.data?.data;
    if (orders) {
      if (orders.length > 0) {
        const newestOrder = orders[0];
        const newestOrderTime = new Date(newestOrder.createdAt).getTime();

        if (!hasInitialized.current) {
          // Initialize lastOrderTime on the first fetch
          if (!lastOrderTime) {
            setLastOrderTime(newestOrderTime);
            localStorage.setItem("last_order_time", newestOrderTime.toString());
          }
          hasInitialized.current = true;
        } else if (lastOrderTime && newestOrderTime > lastOrderTime) {
          // Play the ringtone immediately for the new order
          triggerRingtone();

          // Show Toast notification
          const orderId = newestOrder.orderNumber ? `#${newestOrder.orderNumber}` : newestOrder._id;
          const orderAmount = newestOrder.finalTotalAmount || newestOrder.totalAmount || 0;
          toast.success(`New Order Received: ${orderId}`, {
            description: `Amount: ₹${Number(orderAmount).toFixed(2)}`,
            duration: 7000,
          });

          // Update state and localStorage
          setLastOrderTime(newestOrderTime);
          localStorage.setItem("last_order_time", newestOrderTime.toString());

          // Invalidate active orders queries to refresh orders tables/lists in UI
          queryClient.invalidateQueries({ queryKey: ["orders"] });
        }
      } else {
        if (!hasInitialized.current) {
          hasInitialized.current = true;
        }
      }
    }
  }, [latestOrdersRes, lastOrderTime, queryClient]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
