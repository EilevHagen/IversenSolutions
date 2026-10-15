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

test('ContactPanel_ContainsAccessibleWeb3FormsContactForm', async () => {
  const panel = html.match(/<section id="kontakt"[\s\S]*?<\/section>/)[0];
  const script = await readFile('app.js', 'utf8');
  const styles = await readFile('styles.css', 'utf8');
  assert.match(panel, /id="contact-form"/);
  assert.match(panel, /action="https:\/\/api\.web3forms\.com\/submit"/);
  assert.match(panel, /name="access_key"/);
  assert.match(panel, /name="name"[^>]*required/);
  assert.match(panel, /name="phone"/);
  assert.match(panel, /name="email"/);
  assert.match(panel, /name="message"[^>]*required/);
  assert.match(panel, /class="h-captcha" data-captcha="true"/);
  assert.match(panel, /id="contact-success"[\s\S]*?role="status"/);
  assert.match(panel, /id="contact-success-close" type="button"/);
  assert.doesNotMatch(panel, /\(påkrevd\)|\(valgfri\)/);
  assert.match(script, /contactForm\.classList\.add\("is-success"\)/);
  assert.match(script, /contactForm\.classList\.remove\("is-success"\)/);
  assert.match(styles, /\.contact-success \{ position: absolute; inset: 0;/);
  assert.match(html, /src="https:\/\/web3forms\.com\/client\/script\.js"/);
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

test('ContactForm_RequiresAtLeastOneContactMethod', async () => {
  const form = html.match(/<form\b[^>]*id="contact-form"[\s\S]*?<\/form>/)[0];
  const script = await readFile('app.js', 'utf8');
  assert.match(form, /id="contact-phone"[\s\S]*?aria-describedby="contact-method-hint"/);
  assert.match(form, /id="contact-email"[\s\S]*?aria-describedby="contact-method-hint"/);
  assert.match(form, /Oppgi minst én kontaktmåte: telefonnummer eller e-post/);
  assert.match(script, /phoneInput\.setCustomValidity\(hasContactMethod \? "" : contactMethodMessage\)/);
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
  const references = [...built.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map(match => match[1])
    .filter(value => /\.(?:css|js|png|jpg)$/.test(value));
  const externalScripts = references.filter(value => value.startsWith('https://'));
  const files = references.filter(value => !value.startsWith('https://'));
  assert.deepEqual(externalScripts, ['https://web3forms.com/client/script.js']);
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
