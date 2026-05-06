import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Het team — LesCoach",
  description:
    "Thomas, Joost en Mick bouwen LesCoach — zodat elke leerkracht in het speciaal onderwijs direct de juiste kennis en ondersteuning heeft.",
};

interface TeamMember {
  naam: string;
  rol: string;
  bio: string;
  linkedin: string;
}

const TEAM: TeamMember[] = [
  {
    naam: "Thomas Thijs",
    rol: "Oprichter LesCoach",
    bio: "Thomas werkt vanuit de overtuiging dat leerkrachten in het speciaal onderwijs meer verdienen dan een volle wachtlijst. Hij bouwt LesCoach om de kloof tussen kennis en de klas te dichten.",
    linkedin: "https://www.linkedin.com/in/thomas-thijs/",
  },
  {
    naam: "Joost Stam",
    rol: "Partner",
    bio: "",
    linkedin: "https://www.linkedin.com/in/joost-stam-b36a9013b/",
  },
  {
    naam: "Mick Kitzen",
    rol: "Partner",
    bio: "",
    linkedin: "https://www.linkedin.com/in/mickkitzen/",
  },
];

function Initials({ naam }: { naam: string }) {
  const parts = naam.trim().split(" ");
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (
    <div
      style={{
        width: 72,
        height: 72,
        borderRadius: "50%",
        background: "#8B1A4A",
        color: "#F5F0E8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 24,
        fontWeight: 700,
        flexShrink: 0,
        letterSpacing: 1,
      }}
    >
      {first}{last}
    </div>
  );
}

export default function TeamPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F5F0E8",
        fontFamily: "inherit",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 32px",
          borderBottom: "1px solid #e8e0d4",
          background: "#F5F0E8",
        }}
      >
        <Link
          href="/"
          style={{
            fontWeight: 800,
            fontSize: 20,
            color: "#1a1a2e",
            textDecoration: "none",
            letterSpacing: -0.5,
          }}
        >
          LesCoach
        </Link>
        <Link
          href="/chat"
          style={{
            background: "#8B1A4A",
            color: "#fff",
            padding: "10px 22px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Ga naar Noor →
        </Link>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "72px 24px 56px" }}>
        <span
          style={{
            display: "inline-block",
            border: "1.5px solid #8B1A4A",
            color: "#8B1A4A",
            borderRadius: 999,
            padding: "5px 18px",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 20,
            letterSpacing: 0.3,
          }}
        >
          Het team
        </span>
        <h1
          style={{
            fontSize: "clamp(32px, 6vw, 52px)",
            fontWeight: 800,
            color: "#1a1a2e",
            margin: "0 0 20px",
            letterSpacing: -1,
            lineHeight: 1.1,
          }}
        >
          Wie bouwt LesCoach?
        </h1>
        <p
          style={{
            fontSize: 18,
            color: "#555",
            maxWidth: 560,
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          Drie mensen met dezelfde overtuiging: elke leerkracht verdient directe,
          goede ondersteuning — zonder wachtrij.
        </p>
      </section>

      {/* Team cards */}
      <section
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "0 24px 96px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 28,
        }}
      >
        {TEAM.map((member) => (
          <article
            key={member.naam}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 36,
              boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <Initials naam={member.naam} />
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 18,
                    color: "#1a1a2e",
                    lineHeight: 1.3,
                  }}
                >
                  {member.naam}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: "#8B1A4A",
                    fontWeight: 600,
                    marginTop: 2,
                  }}
                >
                  {member.rol}
                </div>
              </div>
            </div>

            {/* Bio */}
            {member.bio && (
              <p
                style={{
                  fontSize: 15,
                  color: "#444",
                  lineHeight: 1.65,
                  margin: 0,
                  flexGrow: 1,
                }}
              >
                {member.bio}
              </p>
            )}

            {/* LinkedIn */}
            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#0A66C2",
                color: "#fff",
                padding: "10px 18px",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 14,
                width: "fit-content",
                marginTop: "auto",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </a>
          </article>
        ))}
      </section>

      {/* CTA */}
      <section
        style={{
          background: "#8B1A4A",
          color: "#fff",
          textAlign: "center",
          padding: "64px 24px",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(24px, 4vw, 36px)",
            fontWeight: 800,
            margin: "0 0 16px",
            letterSpacing: -0.5,
          }}
        >
          Probeer Noor gratis
        </h2>
        <p style={{ fontSize: 17, opacity: 0.85, margin: "0 0 32px" }}>
          Stel je vraag en krijg direct een kenniskaart op maat.
        </p>
        <Link
          href="/chat"
          style={{
            display: "inline-block",
            background: "#F5F0E8",
            color: "#8B1A4A",
            padding: "14px 36px",
            borderRadius: 10,
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          Start een gesprek met Noor →
        </Link>
      </section>

      <footer
        style={{
          textAlign: "center",
          padding: "24px",
          fontSize: 13,
          color: "#888",
          background: "#F5F0E8",
        }}
      >
        © {new Date().getFullYear()} LesCoach
        {" · "}
        <Link href="/privacy" style={{ color: "#888" }}>
          Privacy
        </Link>
        {" · "}
        <a href="mailto:thomas@lescoach.nl" style={{ color: "#888" }}>
          Contact
        </a>
      </footer>
    </main>
  );
}
