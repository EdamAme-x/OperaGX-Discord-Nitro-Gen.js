function proxyPick<T extends string>(arr: T[]): string {
    const result = arr[Math.floor(Math.random() * arr.length)];
    return `http://${result.split(":")[0]}:${result.split(":")[1]}`;
}
class Counter {
  static count = 0;
}

class PromoGen {
  red = '\x1b[31m(-)\x1b[0m';
  blue = '\x1b[34m(+)\x1b[0m';
  green = '\x1b[32m(+)\x1b[0m';
  yellow = '\x1b[33m(!)\x1b[0m';

  async generatePromo() {
    const url = "https://api.discord.gx.games/v1/direct-fulfillment";
    const headers = new Headers({
      "Content-Type": "application/json",
      "Sec-Ch-Ua":
        '"Opera GX";v="105", "Chromium";v="119", "Not?A_Brand";v="24"',
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 OPR/105.0.0.0",
    });

    const data = {
      partnerUserId: crypto.randomUUID(),
    };

    try {
      const client = await Deno.createHttpClient({
          proxy: {
            url: proxyPick((await Deno.readTextFile("proxies.txt")).split("\n")),
          },
      })

      const requestOptions: RequestInit = {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        ...client
      };

      const response = await fetch(url, requestOptions);

      if (response.status === 200) {
        const json = await response.json();
        const token = json.token;
        if (token) {
          Counter.count += 1;
          console.log(
            `${this.getTimestamp()} ${this.green} Generated!`
          );
          Deno.writeTextFileSync(
            "promos.txt",
            `https://discord.com/billing/partner-promotions/1180231712274387115/${token}\n`,
            { append: true }
          );
        }
      } else if (response.status === 429) {
        console.log(
          `${this.getTimestamp()} ${this.yellow} You are being rate-limited!`
        );
      } else {
        console.log(
          `${this.getTimestamp()} ${this.red} Request failed : ${response.status}`
        );
      }
    } catch (error) {
      console.log(
        `${this.getTimestamp()} ${this.red} Request Failed : ${error.message}`
      );
    }
  }

  getTimestamp() {
    const timeIdk = new Date().toLocaleTimeString();
    return `[${'\x1b[90m' + timeIdk + '\x1b[0m'}]`;
  }
}

class PromoManager {
  private numThreads: number;

  constructor() {
    this.numThreads = 20;
  }

  async startPromoGeneration() {
    const generators = Array.from({ length: this.numThreads }, () =>
      this.generatePromo()
    );
    await Promise.all(generators);
  }

  async generatePromo() {
    const generator = new PromoGen();
    while (true) {
      await generator.generatePromo();
    }
  }

  getTimestamp() {
    const timeIdk = new Date().toLocaleTimeString();
    return `[${'\x1b[90m' + timeIdk + '\x1b[0m'}]`;
  }
}

const manager = new PromoManager();
await manager.startPromoGeneration();
