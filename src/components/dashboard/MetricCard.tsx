
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number | ReactNode;
  description?: string;
  icon?: ReactNode;
  className?: string;
  isLoading?: boolean;
  onClick?: () => void;
}

const MetricCard = ({
  title,
  value,
  description,
  icon,
  className,
  isLoading = false,
  onClick,
}: MetricCardProps) => {
  return (
    <Card 
      className={cn("overflow-hidden", className, onClick && "cursor-pointer card-hover")}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="w-full h-9 skeleton"></div>
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {description && (
          <CardDescription className="mt-2">{description}</CardDescription>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
