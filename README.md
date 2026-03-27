# [KakituLooker](https://kakitu.org/) Client

This is a [Kakitu](https://kakitu.org/) network explorer, written in Angular.  It currently supports the following pages & features:

## Pages

#### [Explore](https://kakitu.org/)
See address history & block hash information

#### [Wallets](https://kakitu.org/wallets)
See kakitu distribution by account balance & the list of top kakitu holders

#### [Known Accounts](https://kakitu.org/known-accounts)
A list of exchanges, developer funds, and other known addresses

#### [Vanity Avatars](https://kakitu.org/vanity)
A showcase of custom vanity avatars.

#### [Network](https://kakitu.org/network)
Distribution, Quorum, & Nakamoto Coefficient statistics for kakitu.

#### [Representatives](https://kakitu.org/representatives)
The list of representatives that process transactions on the kakitu network.

#### [Node](https://kakitu.org/monitor)
Information about the node running the Kakitu Looker.

## Features
- Bookmarks.............................Quickly save hashes or addresses for future reference
- Themes....................................Currently supports a light and dark mode
- Representative Insights.....See which representatives are online/offline
- Rich List Insights...................Quickly see if top kakitu holders are voting for online reps
- Account Insights...................Generate a high-level chart of an account balance over time & account stats
    


## Local Development

### build
`yarn build`

### serve
`yarn start`

### deploy
`yarn build && firebase deploy`

### testing / code quality
`yarn prettier && yarn test && yarn lint`

## Hosting

Firebase hosts this application.


## Issues or Feature Requests

Please feel free to add any feature requests or bug reports to the issues tab found [here](https://github.com/dev-ptera/kakitulooker-client/issues).
