import Typography from "../typography";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const ROWS_OPTIONS = [10, 25, 50, 75, 100, 200, 300, 500];

const SelectRowsPerPage = ({ onRowsPerPageChange, rowsPerPage }) => {
  return (
    <div className="flex items-center gap-2 ml-2">
      <Typography className="text-muted-foreground text-sm whitespace-nowrap">Rows per page:</Typography>
      <Select
        value={String(rowsPerPage)}
        onValueChange={(val) => {
          if (onRowsPerPageChange) onRowsPerPageChange(Number(val));
        }}
      >
        <SelectTrigger className="w-20 h-8">
          <SelectValue placeholder={String(rowsPerPage)} />
        </SelectTrigger>
        <SelectContent>
          {ROWS_OPTIONS.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SelectRowsPerPage;