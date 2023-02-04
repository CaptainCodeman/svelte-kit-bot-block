import type { Handle } from '@sveltejs/kit'
import { isIP } from 'net'

export interface Options {
  log: boolean
  block: boolean
  ip_access: boolean
  hostnames: RegExp[]
  pathnames: RegExp[]
  user_agents: RegExp[]
}

export const createHandler = (options?: Partial<Options>): Handle => {
  const opts = { ...defaultOptions, ...options }

  const handle: Handle = async ({ event, resolve }) => {
    const { request, url } = event
    const { hostname, pathname } = url

    const user_agent = request.headers.get('user-agent') || ''

    const block = (match: boolean, ...messages: string[]) => {
      if (match) {
        if (opts.log) {
          const prefix = opts.block ? 'blocked' : 'would block'
          console.log(prefix, ...messages)
        }
        return opts.block
      }
      return false
    }

    if (block(isIP(hostname) > 0, 'ip address', hostname)) {
      return new Response(null, { status: 410 })
    }

    if (block(opts.hostnames.some(re => re.test(hostname)), 'hostname', hostname)) {
      return new Response(null, { status: 410 })
    }

    if (block(opts.pathnames.some(re => re.test(pathname)), 'pathname', pathname)) {
      return new Response(null, { status: 404 })
    }

    if (block(opts.user_agents.some(re => re.test(user_agent)), 'user-agent', user_agent)) {
      return new Response(null, { status: 410 })
    }

    return resolve(event)
  }
  return handle
}

export const defaultOptions: Options = {
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
}