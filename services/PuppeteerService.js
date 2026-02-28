import puppeteer from 'puppeteer';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export default class PuppeteerService {
  constructor() { }

  async #getBrowser() {
    const browserWSEndpoint = `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_TOKEN}&headless=new`;
    return IS_PRODUCTION
      ? // Connect to browserless so we don't run Chrome on the same hardware in production
      await puppeteer.connect({ browserWSEndpoint })
      : // Run the browser locally while in development
      await puppeteer.launch({ headless: 'new' });
  }

  async pdfFromHtmlAsBuffer(html) {
    const browser = await this.#getBrowser();
    const page = await browser.newPage();
    const dataUrl = `data:text/html;charset=utf-8;base64,${Buffer.from(html).toString('base64')}`;
    await page.goto(dataUrl, { waitUntil: 'load' });
    const buffer = await page.pdf({
      format: 'A4',
    });
    await browser.close();
    return buffer;
  }

  async pdfFromHtmlAsBase64(html) {
    const buffer = await this.pdfFromHtmlAsBuffer(html);
    const base64String = buffer.toString('base64');
    const pdf = `data:application/pdf;base64,${base64String}`
    return pdf;
  }
}