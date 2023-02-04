# svelte-kit-bot-block

Put any server on the internet and you should expect it to be hit with endless spam requests, usually a mix of rogue bots and script kiddies, probing for vulnerabilities.

Instead of allowing these to be processed by your app, which may involve database lookups, it's better to reject them as soon as possible. Ideally, you'd do this at the network or load balancing layer, but if you're using SvelteKit and want a cheap-as-chips solution, you can add a [Server Hook](svelte-kit-bot-block) to handle them before your app has to.

You don't even want your app rendering a nicely formatted error response - these are _not_ legitimate requests, say goodbye to them using as few resources as possible. A simple HTTP response is all that they deserve.

## Usage

Install using your package manager of choice:

    pnpm i svelte-kit-bot-block

Import into your `hooks.server.ts` file:

```ts
import { createHandler } from 'svelte-kit-bot-block'

export const handle = createHandler()
```

If you already have existing hooks you'll likely want to use the [sequence helper](https://kit.svelte.dev/docs/modules#sveltejs-kit-hooks-sequence) to chain them. This hook should be at or close to the start of the chain.

You can pass a configuration option object to `createHandler`. Any option you set will replace the default for that setting.

- **log** (boolean) whether to log blocked (or would-be-blocked) requests
- **block** (boolean) whether to actually block requests (vs just warn, to test the settings)
- **ip_access** (boolean) whether to block IP Address only requests (that don't use your domain name)
- **hostnames** array of `RegExp`'s to check against the hostname of the request
- **pathnames** array of `RegExp`'s to check against the pathname of the request
- **user_agents** array of `RegExp`'s to check against the user-agent of the request

Requests that fail the pathname check will be rejected with a 404 response
Requests that fail all other checks will be rejected with a 410 response

I suggest running first with `{ log: true, block: false }` to see what traffic _would_ be blocked without actually blocking anything. Once you are happy that legitimate traffic wouldn't be impacted, you can enable the `block` option and at a future date, set `log` to false to remove as much noise from your logs as possible.

### Default Config

The default settings are shown below. You can import these as `defaultOptions` to add to the existing entries instead of replacing them, e.g.:

```ts
import { createHandler, defaultOptions } from 'svelte-kit-bot-block'

export const handle = createHandler({
	domains: [...defaultOptions.domains, /^some\.other\.annoying\.domain\.com$/],
})
```

```ts
// whether to log action
log: true,

// whether to block on failure (vs just warn, for testing)
block: false,

// block direct ip access (no hostname provided)
ip_access: true,

// block matching hostnames
hostnames: [
  // nuisance requests on GCP
  /\.appspot\.com$/,

  // pretty confident we're not google
  /\.google.com$/,
],

// block matching pathnames
pathnames: [
  // block unused file extensions
  /\.(env|git|ssh|php|rss|yml|yaml|asp|cgi|map|aspx|ashx)$/,

  // git content
  /\.git\/\w+$/,

  // block wordpress (Windows Live Writer)
  /\/wlwmanifest\.xml$/,
],

// block matching user-agents
user_agents: [
  // from https://community.cloudflare.com/t/top-50-user-agents-to-block/222594
  /(360Spider|acapbot|acoonbot|ahrefs|alexibot|asterias|attackbot|backdorbot|becomebot|binlar|blackwidow|blekkobot|blexbot|blowfish|bullseye|bunnys|butterfly|careerbot|casper|checkpriv|cheesebot|cherrypick|chinaclaw|choppy|clshttp|cmsworld|copernic|copyrightcheck|cosmos|crescent|cy_cho|datacha|demon|diavol|discobot|dittospyder|dotbot|dotnetdotcom|dumbot|emailcollector|emailsiphon|emailwolf|exabot|extract|eyenetie|feedfinder|flaming|flashget|flicky|foobot|g00g1e|getright|gigabot|go-ahead-got|gozilla|grabnet|grafula|harvest|heritrix|httrack|icarus6j|jetbot|jetcar|jikespider|kmccrew|leechftp|libweb|linkextractor|linkscan|linkwalker|loader|masscan|miner|majestic|mechanize|mj12bot|morfeus|moveoverbot|netmechanic|netspider|nicerspro|nikto|ninja|nutch|octopus|pagegrabber|planetwork|postrank|proximic|purebot|pycurl|python|queryn|queryseeker|radian6|radiation|realdownload|rogerbot|scooter|seekerspider|semalt|siclab|sindice|sistrix|sitebot|siteexplorer|sitesnagger|skygrid|smartdownload|snoopy|sosospider|spankbot|spbot|sqlmap|stackrambler|stripper|sucker|surftbot|sux0r|suzukacz|suzuran|takeout|teleport|telesoft|true_robots|turingos|turnit|vampire|vikspider|voideye|webleacher|webreaper|webstripper|webvac|webviewer|webwhacker|winhttp|wwwoffle|woxbot|xaldon|xxxyy|yamanalab|yioopbot|youda|zeus|zmeu|zune|zyborg)/
],
```
