const { randomIndex, randomEntry } = require("./util");
const { combinations, sentences, social } = require("./data.json");

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

/**
 * Respond with hello worker text
 * @param {Request} request
 */
let handleRequest = async (request) => {

    // Used to get the route.
    let url = new URL(request.url);

    // Handle each of the possible routes.
    switch (url.pathname) {
        case "/": {
            return handleRoot(url);
        }

        case "/favicon.ico": {
            return handle404();
        }

        case "/api/generate": {
            return handleApi(url);
        }

        default: {
            return handleDrama(url);
        }
    }
}

let generateRandomDrama = () => {
    let drama = {};

    drama.sentence = randomIndex(sentences);

    for (const key in combinations) {
        drama[key] = [randomIndex(combinations[key]), randomIndex(combinations[key]),
                      randomIndex(combinations[key]), randomIndex(combinations[key])];
    }

    return drama;
}

let handleRoot = (url) => {
    const drama = generateRandomDrama();

    const dramaUrl = btoa(JSON.stringify(drama));
    const host = url.host === "larrygenerator.com" ? "localhost:8787" : url.host;

    return handleDrama(new URL(`${url.protocol}//${host}/${dramaUrl}`));
}

let handleDrama = (url) => {
    try {
        let drama = createDramaMessage(url);
        url.pathname = "/" + btoa(JSON.stringify(drama.usedDramaIds));
        let teaser = randomEntry(social);

        return new Response(renderDrama(drama.message, url.href, url.pathname, teaser), {
            headers: {
                "content-type": "text/html;charset=utf8"
            }
        });
    } catch (e) {
        return handle404();
    }

}

let createDramaMessage = (url) => {
    let dramaIds = JSON.parse(atob(url.pathname.split("/")[1]));
    let usedDramaIds = { sentence: dramaIds.sentence };
    let message = sentences[dramaIds.sentence];

    for (const key in combinations) {
        const placeholder = `[${key}]`;
        if (!message.includes(placeholder)) continue;
        usedDramaIds[key] = [];
        for (const id of dramaIds[key]) {
            if (!message.includes(placeholder)) continue;
            usedDramaIds[key].push(id);

            const replacement = combinations[key][id];
            message = message.replace(placeholder, replacement);
        }
    }

    return { usedDramaIds, message }
}


let handleApi = (url) => {

    const drama = generateRandomDrama();
    const dramaUrl = btoa(JSON.stringify(drama));
    const host = "larrygenerator.com";

    const dramaPermaLink = new URL(`${url.protocol}//${host}/${dramaUrl}`)
    const dramaMessage = createDramaMessage(dramaPermaLink);

    dramaPermaLink.pathname = "/" + btoa(JSON.stringify(dramaMessage.usedDramaIds));

    let response = {
        response: dramaMessage.message,
        permalink: dramaPermaLink.href
    }

    return new Response(JSON.stringify(response), {
        headers: {
            "content-type": "application/json;charset=utf8"
        }
    });

}

let handle404 = () => {
    return new Response(render404(), {
        headers: {
            status: "404",
            "content-type": "text/html;charset=utf8"
        }
    });

}

let renderDrama = (message, share, sharePath, teaser) => {
    return `
<!DOCTYPE html>
    <head>
        <title>larrygenerator</title>
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
        <script src="https://code.jquery.com/jquery-3.5.1.min.js" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossorigin="anonymous"></script>
        <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
        <meta name="description" content="True stories about Larry!"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <meta name="og:title" content="${teaser}"/>
        <meta name="og:type" content="website"/>
        <meta name="og:url" content="${share}"/>
        <meta name="og:site_name" content="Larry Generator"/>
        <meta name="og:description" content="${message}"/>

        <link rel="icon" href="data:,">
        <style>
            body { 
                padding-top:50px; 
                background-color: #121212;
                color: white;
            }
        </style>

        <script>
            const konami = ["l", "a", "r", "r", "y", "."];
            const inputs = ["", "", "", "", "", ""]

            function pushInput(key) {
                inputs.shift();
                inputs.push(key);
            }

            function checkInputs() {
                for (let i in inputs) {
                    if (konami[i] != inputs[i]) {
                        return false;
                    }
                }
                return true;
            }

            function onLoad() {
                window.history.replaceState({}, "", "${sharePath}");
            }

            function onKeyDown(e) {
                pushInput(e.key);

                if (checkInputs()) {
                    document.getElementById("larry").innerHTML = "<img src=\\"https://media3.giphy.com/media/mAyKtbkBTTpFm/giphy.gif\\" alt=\\"LARRYY!\\"/>"
                }

                if (e.key === "Enter") {
                    window.location = "/";
                }
            }

            window.onload = onLoad;
            window.onkeydown = onKeyDown;
        </script>
    </head>
    
    <body class="container">
        <main>
            <div class="jumbotron" style="background-color:#1D1D1D;">
                <h1>larrygenerator.com</h1>
                <hr>
                <span id="larry"></span>
                <h3>${message}</h3>  
                <button type="button" class="btn btn-dark" onclick="location.href='/';">learn more about larry</button>
            </div>
        </main>

        <footer>
            <p class="text-center text-muted"><a href="https://syscraft.org" class="text-center">Syscraft</a> is fully 
            endorsed by Larry International. | We have an <a href="https://larrygenerator.com/api/generate">API</a>! | Contribute on 
            <a href="https://github.com/LLS-LLM/larrygenerator">GitHub!</a></p>
        </footer>
    </body>

</html>
    `
}

let render404 = () => {
    return `
    <!DOCTYPE html>
    
        <title>larrygenerator</title>
        <meta name="description" content="no u"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="og:type" content="website"/>
        <meta name="og:site_name" content="Larry Generator"/>
        <meta name="og:description" content="no u!"/>
    
        <img style="display: block; margin-left: auto; margin-right: auto;" src='https://cdn.paradaux.io/img/4itkq.gif'>
    </html>
    `
}
