import { Search, MapPin } from "lucide-react";
export function JobSearchForm({
  search = "",
  location = "",
  compact = false,
}: {
  search?: string;
  location?: string;
  compact?: boolean;
}) {
  return (
    <form
      action="/jobs"
      method="get"
      className={compact ? "listing-search" : "search-bar"}
    >
      <Search size={20} />
      <input
        name="search"
        defaultValue={search}
        placeholder="Chức danh, kỹ năng hoặc từ khóa..."
        aria-label="Từ khóa việc làm"
      />
      <span className="search-divider" />
      <MapPin size={19} />
      <input
        name="location"
        defaultValue={location}
        placeholder="Địa điểm"
        aria-label="Địa điểm"
      />
      <button type="submit" className="button button-primary">
        Tìm việc
      </button>
    </form>
  );
}
