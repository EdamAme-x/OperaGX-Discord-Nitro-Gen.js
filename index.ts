if (!Deno.stat("./promos.txt")) {
    console.error("promos.txtを作成してください。")
    Deno.exit(1)
}


function genString(length: number): string {
  const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function proxyPick<T extends string>(arr: T[]): string {
    const result = arr[Math.floor(Math.random() * arr.length)];
    return `http://${result.split(":")[0]}:${result.split(":")[1]}`;
}

console.log("Created by @amex2189")

class Counter {
    static count = Deno.readTextFileSync("./promos.txt").split("\n").length;
}

class PromoGen {
    red = '\x1b[31m(-)\x1b[0m';
    blue = '\x1b[34m(+)\x1b[0m';
    green = '\x1b[32m(+)\x1b[0m';
    yellow = '\x1b[33m(!)\x1b[0m';
    proxies = (Deno.readTextFileSync("proxies.txt")).split("\n");

    private static clientMap = new Map<string, Deno.HttpClient>();

    private async getClient() {
        const proxies = this.proxies;
        const proxyUrl = proxyPick(proxies);

        if (!PromoGen.clientMap.has(proxyUrl)) {
            console.log(`${this.getTimestamp()} ${this.green} Created new proxy: ${proxyUrl}`);
            const newClient = await Deno.createHttpClient({
                proxy: { url: proxyUrl },
            });
            PromoGen.clientMap.set(proxyUrl, newClient);
        }

        return PromoGen.clientMap.get(proxyUrl);
    }

    async generatePromo() {
        const url = "https://api.discord.gx.games/v1/direct-fulfillment";
        const headers = new Headers({
            'authority': 'api.discord.gx.games',
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'content-type': 'application/json',
            'origin': 'https://www.opera.com',
            'referer': 'https://www.opera.com/',
            'sec-ch-ua': '"Opera GX";v="105", "Chromium";v="119", "Not?A_Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 OPR/105.0.0.0'
        });

        const data = {
            partnerUserId: genString(64)
        };

        try {
            const client = await this.getClient();

            let requestOptions: RequestInit & {
                client: Deno.HttpClient
            } | RequestInit = {
                method: "POST",
                headers,
                body: JSON.stringify(data),
                // @ts-ignore NOTE: LIB SIDE ERROR
                client
            };

            if (Math.random() > 0.95 || Deno.args[0] === "raw") {
                requestOptions = {
                    method: "POST",
                    headers,
                    body: JSON.stringify(data),
                };
            }

            const response = await fetch(url, requestOptions);

            if (response.status === 200) {
                const json = await response.json();
                const token = json.token;
                if (token) {
                    Counter.count += 1;
                    console.log(`${this.getTimestamp()} ${this.green} Generated! [${Counter.count}]`);
                    Deno.writeTextFileSync(
                        "promos.txt",
                        `https://discord.com/billing/partner-promotions/1180231712274387115/${token}\n`,
                        { append: true }
                    );
                }
            } else if (response.status === 429) {
                console.log(`${this.getTimestamp()} ${this.yellow} You are being rate-limited!`);
            } else {
                console.log(`${this.getTimestamp()} ${this.red} Request failed : ${response.status}`);
            }
        } catch (_error) {
            console.log(`${this.getTimestamp()} ${this.red} PROXY ERROR`);
        }
    }

    getTimestamp() {
        const timeIdk = new Date().toLocaleTimeString();
        return `[${'\x1b[90m' + timeIdk + '\x1b[0m'}]`;
    }
}

class PromoManager {
    private numThreads: number;

    constructor(num: number) {
        this.numThreads = num;
    }

    async startPromoGeneration() {
        const generators = Array.from({ length: this.numThreads }, () => {
            console.log("[!] LAUNCH")
            return this.generatePromo()
        });
        
        await Promise.all(generators);
    }

    async generatePromo() {
        const generator = new PromoGen();
        console.log("[!] LOAD")
        while (true) {
            await generator.generatePromo();
        }
    }

    getTimestamp() {
        const timeIdk = new Date().toLocaleTimeString();
        return `[${'\x1b[90m' + timeIdk + '\x1b[0m'}]`;
    }
}

const manager = new PromoManager(10);
await manager.startPromoGeneration();
