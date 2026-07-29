import { HexColorPicker } from "react-colorful";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const HEX_PATTERN = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const ColorPickerInput = ({ id, value, onChange, placeholder = "e.g. Golden Brown" }) => {
  const isHex = HEX_PATTERN.test(value || "");

  return (
    <div className="flex gap-2">
      <Input
        id={id}
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1"
      />
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "border-input h-9 w-9 shrink-0 rounded-md border bg-[repeating-conic-gradient(#0000000d_0%_25%,transparent_0%_50%)] bg-[length:8px_8px]"
            )}
            title="Pick a color"
          >
            <span
              className="block h-full w-full rounded-[5px]"
              style={{ backgroundColor: isHex ? value : "transparent" }}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3">
          <HexColorPicker color={isHex ? value : "#000000"} onChange={onChange} />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ColorPickerInput;
