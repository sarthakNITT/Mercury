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
import { AlertTriangle } from "lucide-react";
import { Event } from "@/lib/api";

interface FraudTableProps {
  events: Event[];
}

export function FraudTable({ events }: FraudTableProps) {
  return (
    <Card className="border-red-500/20 bg-red-500/5 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400 text-base">
          <AlertTriangle className="h-5 w-5" />
          Fraud Feed (High Risk)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-red-500/10 border-red-500/10">
              <TableHead className="text-red-600/70 dark:text-red-400/70">
                Time
              </TableHead>
              <TableHead className="text-red-600/70 dark:text-red-400/70">
                User
              </TableHead>
              <TableHead className="text-red-600/70 dark:text-red-400/70">
                Product
              </TableHead>
              <TableHead className="text-red-600/70 dark:text-red-400/70">
                Risk Score
              </TableHead>
              <TableHead className="text-red-600/70 dark:text-red-400/70">
                Decision
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {events.map((event: any) => (
              <TableRow
                key={event.id}
                className="hover:bg-red-500/10 border-red-500/10"
              >
                <TableCell className="font-mono text-xs text-red-600/80 dark:text-red-400/80">
                  {new Date(event.createdAt).toLocaleTimeString()}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {event.user?.name || "Unknown"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {event.product?.name || "Unknown"}
                </TableCell>
                <TableCell className="font-bold text-red-600 dark:text-red-400">
                  {event.meta?.riskScore}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      event.meta?.decision === "BLOCK"
                        ? "destructive"
                        : "secondary"
                    }
                    className="shadow-sm"
                  >
                    {event.meta?.decision}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {events.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground h-24"
                >
                  No suspicious activity detected
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
