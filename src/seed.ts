import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_TEMPLATE_HTML = `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><title>{{fullName}} - Resume</title></head>
  <body>
    <header>
      <h1>{{fullName}}</h1>
      <div class="contact">
        <span>{{email}}</span>
        {{#phoneNumber}}<span> · {{phoneNumber}}</span>{{/phoneNumber}}
        {{#linkedinUrl}}<span> · <a href="{{linkedinUrl}}">{{linkedinUrl}}</a></span>{{/linkedinUrl}}
        {{#address}}<span> · {{address}}</span>{{/address}}
      </div>
      <h2>{{targetRole}}</h2>
    </header>

    <section>
      <h3>Summary</h3>
      <p>{{summary}}</p>
    </section>

    <section>
      <h3>Skills</h3>
      <ul class="skills">
        {{#skills}}<li>{{.}}</li>{{/skills}}
      </ul>
    </section>

    <section>
      <h3>Experience</h3>
      {{#experience}}
        <div class="item">
          <div class="row"><strong>{{title}}</strong><span>{{startDate}} – {{endDate}}</span></div>
          <div class="row"><em>{{company}}</em>{{#location}}<span>{{location}}</span>{{/location}}</div>
          <ul>
            {{#bullets}}<li>{{.}}</li>{{/bullets}}
          </ul>
        </div>
      {{/experience}}
    </section>

    <section>
      <h3>Projects</h3>
      {{#projects}}
        <div class="item">
          <strong>{{name}}</strong>
          <p>{{description}}</p>
          {{#technologies.length}}
          <div class="tech">{{#technologies}}<span>{{.}}</span>{{/technologies}}</div>
          {{/technologies.length}}
        </div>
      {{/projects}}
    </section>

    <section>
      <h3>Education</h3>
      {{#education}}
        <div class="item">
          <div class="row"><strong>{{degree}}</strong><span>{{startDate}} – {{endDate}}</span></div>
          <div><em>{{school}}</em></div>
        </div>
      {{/education}}
    </section>

    {{#certifications.length}}
    <section>
      <h3>Certifications</h3>
      <ul>
        {{#certifications}}<li>{{name}} — {{issuer}} ({{year}})</li>{{/certifications}}
      </ul>
    </section>
    {{/certifications.length}}
  </body>
</html>`;

const DEFAULT_TEMPLATE_CSS = `
* { box-sizing: border-box; }
body { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #1f2937; padding: 40px 56px; font-size: 11pt; line-height: 1.45; }
h1 { font-size: 24pt; margin: 0; color: #111827; }
h2 { font-size: 12pt; margin: 4px 0 12px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; }
h3 { font-size: 11pt; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin: 18px 0 10px; color: #111827; }
.contact { color: #4b5563; font-size: 10pt; margin-top: 4px; }
.contact a { color: #2563eb; text-decoration: none; }
section { margin-bottom: 14px; }
.item { margin-bottom: 12px; }
.row { display: flex; justify-content: space-between; align-items: baseline; }
ul { margin: 4px 0 4px 18px; padding: 0; }
li { margin-bottom: 2px; }
.skills { display: flex; flex-wrap: wrap; gap: 6px 14px; list-style: none; margin-left: 0; }
.skills li { background: #f3f4f6; padding: 2px 10px; border-radius: 999px; font-size: 9.5pt; }
.tech { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.tech span { background: #eff6ff; color: #1d4ed8; padding: 2px 8px; border-radius: 4px; font-size: 9pt; }
`;

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@resumetailor.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
  const name = process.env.SEED_ADMIN_NAME ?? "Root Admin";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await prisma.user.create({
      data: { email, passwordHash, name, role: Role.ADMIN },
    });
    console.log(`Created admin: ${admin.email}`);

    await prisma.resumeTemplate.create({
      data: {
        name: "Modern Minimal",
        description: "Clean, ATS-friendly single-column template.",
        htmlTemplate: DEFAULT_TEMPLATE_HTML,
        cssStyles: DEFAULT_TEMPLATE_CSS,
        createdByAdminId: admin.id,
      },
    });
    console.log("Created default template: Modern Minimal");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
