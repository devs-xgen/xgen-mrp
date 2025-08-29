import { Metadata } from "next";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import changelog from "@/data/changelog.json";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Release notes and updates for XGen MRP",
};

type ChangelogEntry = {
  version: string;
  date: string; // ISO date string
  changes: string[];
  mediaLink?: string;
};

type ChangelogData = {
  project?: string;
  entries: ChangelogEntry[];
};

function isLocalPath(url: string) {
  return url.startsWith("/");
}

export default function ChangelogPage() {
  const data = changelog as ChangelogData;
  const entries = [...(data.entries || [])].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Changelog</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.project || "XGen MRP"} · Product updates and release notes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <span className="text-sm text-muted-foreground hover:text-foreground">Back to Home</span>
            </Link>
          </div>
        </div>

        {entries.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No entries yet</CardTitle>
              <CardDescription>
                Add your first release note by editing <code>src/data/changelog.json</code>.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-6">
            {entries.map((entry, idx) => {
              const anchorId = `v-${entry.version.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
              const isLatest = idx === 0;
              return (
                <Card
                  key={`${entry.version}-${entry.date}`}
                  id={anchorId}
                  className="bg-white"
                >
                  <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <Badge className="text-xs" variant="secondary">
                        v{entry.version}
                      </Badge>
                      {isLatest && (
                        <Badge className="text-xs" variant="success">
                          Latest
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                      <Link
                        href={`#${anchorId}`}
                        className="text-xs text-muted-foreground hover:text-foreground"
                        aria-label={`Permalink to version ${entry.version}`}
                      >
                        #
                      </Link>
                    </div>
                    <CardTitle className="text-base font-semibold">
                      Release Notes
                    </CardTitle>
                    <CardDescription>
                      {entry.changes.length} change{entry.changes.length !== 1 ? "s" : ""}
                    </CardDescription>
                  </div>

                  {entry.mediaLink && (
                    <div className="mt-3 sm:mt-0">
                      {isLocalPath(entry.mediaLink) ? (
                        <Image
                          src={entry.mediaLink}
                          alt={`Release ${entry.version}`}
                          width={320}
                          height={180}
                          className="rounded-lg border object-cover"
                        />
                      ) : (
                        // For remote images, use plain img to avoid domain whitelist issues
                        // CSP allows https images via middleware headers
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={entry.mediaLink}
                          alt={`Release ${entry.version}`}
                          width={320}
                          height={180}
                          className="rounded-lg border object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>
                  )}
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-foreground/90">
                      {entry.changes.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-10 text-xs text-muted-foreground">
          NOTE TO EDITOR: To edit, update <code>src/data/changelog.json</code> in the repository and redeploy.
          You can optionally store images under <code>public/images/releases/</code> and reference them via <code>/images/releases/&lt;file&gt;</code>.
        </div>
      </div>
    </div>
  );
}
