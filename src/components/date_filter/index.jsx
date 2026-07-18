import * as React from "react";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const predefinedRanges = {
  "All Time": null,
  "This Week": {
    from: startOfWeek(new Date()),
    to: endOfWeek(new Date()),
  },
  "This Month": {
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  },
  "This Year": {
    from: startOfYear(new Date()),
    to: endOfYear(new Date()),
  },
};

const rangeLabels = Object.keys(predefinedRanges).concat("Custom");

export function DateRangePicker({ className, onChange }) {
  const [selectedLabel, setSelectedLabel] = React.useState("All Time");
  const [customRange, setCustomRange] = React.useState([null, null]);
  const [open, setOpen] = React.useState(false);

  const displayValue = React.useMemo(() => {
    if (selectedLabel === "All Time") return "All Time";
    if (selectedLabel === "Custom" && customRange[0] && customRange[1])
      return `${format(customRange[0], "LLL dd, y")} - ${format(
        customRange[1],
        "LLL dd, y"
      )}`;
    const range = predefinedRanges[selectedLabel];
    if (range) {
      return `${format(range.from, "LLL dd, y")} - ${format(
        range.to,
        "LLL dd, y"
      )}`;
    }
    return "Pick date range";
  }, [selectedLabel, customRange]);

  React.useEffect(() => {
    if (onChange) {
      if (selectedLabel === "Custom") {
        onChange(
          customRange[0] && customRange[1]
            ? { from: customRange[0], to: customRange[1] }
            : null
        );
      } else {
        onChange(predefinedRanges[selectedLabel] || null);
      }
    }
  }, [selectedLabel, customRange, onChange]);

  return (
    <div className={cn(className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full min-w-[220px] justify-between text-left font-normal"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <CalendarIcon className="size-4 shrink-0" />
              <span className="truncate">{displayValue}</span>
            </div>
            <ChevronDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className={cn(
            selectedLabel === "Custom"
              ? "w-fit max-h-[80vh] overflow-auto"
              : "w-56"
          )}
        >
          <div className="space-y-2">
            {rangeLabels.map((label) => (
              <Button
                key={label}
                variant={selectedLabel === label ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  setSelectedLabel(label);
                  if (label !== "Custom") setOpen(false);
                }}
              >
                {label}
              </Button>
            ))}
            {selectedLabel === "Custom" && (
              <div className="mt-2 border rounded-md p-2">
                <DatePicker
                  selectsRange
                  startDate={customRange[0]}
                  endDate={customRange[1]}
                  onChange={(update) => setCustomRange(update)}
                  inline
                  monthsShown={2}
                  maxDate={new Date()}
                  isClearable
                />
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
