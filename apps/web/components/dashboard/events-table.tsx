"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Event } from "@/lib/api";

interface EventsTableProps {
  events: Event[];
}

export function EventsTable({ events }: EventsTableProps) {
  return (
    <Card className="col-span-4 border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Recent Activity (Live)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-muted/50">
              <TableHead className="w-[100px]">Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Product</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.slice(0, 10).map((event) => (
              <TableRow
                key={event.id}
                className="hover:bg-muted/50 transition-colors"
              >
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {new Date(event.createdAt).toLocaleTimeString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      event.type === "PURCHASE"
                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                        : event.type === "BLOCK"
                          ? "bg-red-500/10 text-red-600 border-red-500/20"
                          : "bg-secondary text-secondary-foreground"
                    }
                  >
                    {event.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {event.user?.name || "Unknown"}
                </TableCell>
                <TableCell className="text-sm truncate max-w-[150px] text-muted-foreground">
                  {event.product?.name || "Unknown"}
                </TableCell>
              </TableRow>
            ))}
            {events.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground h-24"
                >
                  No recent events
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
