# Hey Frontend

This is a web frontend for the ['hey' HTTP load generation utility](https://github.com/rakyll/hey)

It provides a means to both run `hey`, and then display report with charts of the results

### Screenshot

![](https://user-images.githubusercontent.com/14982936/56269600-ec53b280-60eb-11e9-93ea-0917b3a9827c.png)

# Running Locally

The server is written in Node.js, start with the following. The server will listen on port 3000

```bash
yarn install
yarn start
```

(You can use npm instead of yarn if you're old fashioned)

# Running in Docker

Container image is hosted publicly on GitHub Registry, run with

```bash
docker run -d -p 3000:3000 ghcr.io/benc-uk/hey-frontend:latest
```
