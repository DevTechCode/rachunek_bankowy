import { XMLParser } from "fast-xml-parser";
import { Operacja } from "../Operacja.ts";

export type ParsedHistory = {
  search: {
    account: string;
    date: { since: string; to: string };
    filtering: string;
  };
  operations: Operacja[];
};

export function parseAccountHistoryXml(xml: string): ParsedHistory {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    textNodeName: "text",
    trimValues: true,
    parseTagValue: false,
  });

  const json = parser.parse(xml);

  const searchNode = json?.["account-history"]?.search ?? {};
  const search = {
    account: (searchNode?.account ?? "").toString(),
    date: {
      since: searchNode?.date?.since ?? "",
      to: searchNode?.date?.to ?? "",
    },
    filtering: (searchNode?.filtering ?? "").toString(),
  };

  const opsNode = json?.["account-history"]?.operations?.operation ?? [];
  const opsArray: any[] = Array.isArray(opsNode) ? opsNode : [opsNode];

  const operations = opsArray.map((op) => Operacja.fromXml(op));

  return { search, operations };
}
