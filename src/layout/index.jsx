import { useEffect, useState, useRef } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOrders } from "@/pages/orders/helpers/fetchOrders";
import { playLoudRingtone } from "@/utils/sound";
import { toast } from "sonner";

const Layout = () => {
  const queryClient = useQueryClient();
  
  // Track last play time to prevent overlapping and respect the 2-minute reminder interval
  const lastPlayTimeRef = useRef(0);
  
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

  // Poll specifically for pending orders (to check if reminder ringtone is needed)
  const { data: pendingOrdersRes } = useQuery({
    queryKey: ["pending-orders-count"],
    queryFn: () => fetchOrders({ params: { page: 1, per_page: 1, status: "pending" } }),
    refetchInterval: 15000, // 15 seconds
    refetchIntervalInBackground: true,
  });

  const pendingCount = pendingOrdersRes?.response?.data?.total || 0;
  const hasPending = pendingCount > 0;

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

  // Periodic reminder ringtone (every 2 minutes while there are pending orders)
  useEffect(() => {
    let intervalId = null;

    if (hasPending) {
      // Play immediately if it hasn't been played in the last 2 minutes
      const timeSinceLastPlay = Date.now() - lastPlayTimeRef.current;
      if (timeSinceLastPlay >= 120000) {
        triggerRingtone();
      }

      // Check every 10 seconds if we need to repeat the reminder ringtone
      intervalId = setInterval(() => {
        const elapsed = Date.now() - lastPlayTimeRef.current;
        if (elapsed >= 120000) {
          triggerRingtone();
        }
      }, 10000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [hasPending]);

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
