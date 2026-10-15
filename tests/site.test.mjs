import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const html = await readFile('index.html', 'utf8');
const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);

test('Contact_UsesCorrectVisibleAndStructuredDetails', () => {
  assert.match(html, /href="tel:\+4790263772"/);
  assert.match(html, /href="mailto:post@iversensolutions\.no"/);
  assert.equal(schema.telephone, '+4790263772');
  assert.equal(schema.email, 'post@iversensolutions.no');
  assert.equal(schema.identifier, '938528403');
  assert.equal(schema.address.streetAddress, 'Tveraberget 20');
  assert.equal(schema.address.addressLocality, 'Ålesund');
});

test('ContactPanel_ContainsOnlyFormPlaceholder', () => {
  const panel = html.match(/<section id="kontakt"[\s\S]*?<\/section>/)[0];
  assert.match(panel, /id="kontaktskjema"/);
  assert.doesNotMatch(panel, /<a\b|href=|0[123] \//);
});

test('Header_ProvidesPhoneEmailAndFacebookLinks', () => {
  const header = html.match(/<header\b[\s\S]*?<\/header>/)[0];
  const contacts = [...header.matchAll(/class="header-contact[^"]*" href="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(contacts, [
    'tel:+4790263772',
    'mailto:post@iversensolutions.no',
    'https://www.facebook.com/p/Iversen-Solutions-61594828174941/',
  ]);
});

test('SectionLabels_OmitDecorativeNumbering', () => {
  assert.doesNotMatch(html, /0[123] \/|<span>0[123]<\/span>/);
});

test('FormPlaceholder_IsHonestAndDoesNotCollectPersonalData', () => {
  assert.match(html, /id="kontaktskjema"/);
  assert.match(html, /Kontaktskjema kommer/);
  assert.doesNotMatch(html, /<(?:form|input|textarea|button)\b/);
});

test('Navigation_HasUniqueTargetsAndNorwegianLandmarks', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const match of html.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(ids.includes(match[1]), `Missing target: ${match[1]}`);
  }
  assert.match(html, /<html lang="nb">/);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
  assert.equal([...html.matchAll(/<main\b/g)].length, 1);
  assert.match(html, /class="skip-link" href="#main"/);
  assert.doesNotMatch(html, /tabindex="[1-9]/);
});

test('Production_ContainsOnlySelfHostedRuntimeAssets', async () => {
  const built = await readFile(join('dist', 'index.html'), 'utf8');
  assert.equal(built, html);
  const files = [...built.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map(match => match[1])
    .filter(value => /\.(?:css|js|png|jpg)$/.test(value));
  assert.deepEqual(files, ['assets/favicon.png', 'app.css', 'app.js', 'assets/logo.png', 'assets/logo.png']);
  for (const file of new Set([...files, 'assets/social.jpg'])) {
    assert.ok((await stat(join('dist', file))).size > 0);
  }
  const css = await readFile(join('dist', 'app.css'), 'utf8');
  assert.doesNotMatch(css, /@tailwind|@import|url\([\s"']*https?:/);
  assert.ok(Buffer.byteLength(css) < 25000, 'CSS must stay below 25 kB uncompressed');
});

test('Seo_HasConsistentCanonicalSitemapAndSocialMetadata', async () => {
  assert.match(html, /<title>Iversen Solutions \|.*Ålesund<\/title>/);
  assert.match(html, /rel="canonical" href="https:\/\/iversensolutions\.no\/"/);
  assert.equal(schema.url, 'https://iversensolutions.no/');
  assert.match(await readFile('sitemap.xml', 'utf8'), /<loc>https:\/\/iversensolutions\.no\/<\/loc>/);
  assert.match(await readFile('robots.txt', 'utf8'), /Sitemap: https:\/\/iversensolutions\.no\/sitemap\.xml/);
  assert.match(html, /property="og:image:alt"/);
});

test('Services_OmitColumnLinksAndHeroBottomStrip', () => {
  const services = html.match(/<section id="tjenester"[\s\S]*?<\/section>/)[0];
  assert.equal([...services.matchAll(/<article\b/g)].length, 3);
  assert.doesNotMatch(services, /<a\b/);
  assert.doesNotMatch(html, /hero-bottom|scroll-arrow|service-link/);
});
