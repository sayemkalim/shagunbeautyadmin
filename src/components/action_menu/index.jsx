import { Ellipsis } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

const ActionMenu = ({ options = [] }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Ellipsis className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-44 space-y-0.5 p-1.5 text-sm"
      >
        {options.map(({ label, icon: Icon, action, className }, index) => (
          <button
            key={index}
            onClick={action}
            className={cn(
              "hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
              className
            )}
          >
            {Icon && <Icon className="size-4" />}
            {label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

export default ActionMenu;
