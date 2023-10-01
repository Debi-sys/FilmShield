try {
  from config import dtdd_api_enabled;
  try {
    from config import dtdd_api_key;
    api_headers = {'Accept': 'application/json', 'X-API-KEY': dtdd_api_key};
    check_request = requests.get('https://www.doesthedogdie.com/search?q=old%20yeller', {headers: api_headers});
    try {
      JSON.parse(check_request.text);
    } catch (e) {
      dtdd_api_enabled = false;
      console.log("Failed to connect to DTDD's official api. Please check your API key, or disable the DTDD official API module.");
      exit(1);
    }
  } catch (e) {
    console.log("Disabled DTDD's official API due to api key not being set.");
    dtdd_api_enabled = false;
  }
} catch (e) {
  dtdd_api_enabled = false;
}

if (!dtdd_api_enabled) {
  console.log("⚠ DTDD's api is recommended for performance reasons");
}
try {
  from config import use_memcache;
  if (use_memcache) {
    try {
      from config import memcache_address, memcache_port, invalidation_time;
    } catch (e) {
      console.log("⚠ Please set memcache_address, memcache_port and invalidation_time in config.js");
      use_memcache = false;
    }
  }
} catch (e) {
  console.log("⚠ Please set use_memcache in config.js");
  use_memcache = false;
}

if (use_memcache) {
  from pymemcache.client import base;
  client = base.Client([memcache_address, memcache_port]);
  console.log("✅ Established memcache client");
} else {
  console.log("⚠ memcache is disabled - we recommend you enable it to improve performance");
}

base_string = "https://www.doesthedogdie.com/{media_id}";

// Define functions to fetch trigger warnings
function getTopics(media_id) {
  // Implement your code here to fetch topics
  // ...
}

function getTopicsAPI(media_id) {
  // Implement your code here to fetch topics using the API
  // ...
}

function getInfo(media_id) {
  const to_return = [];
  if (dtdd_api_enabled) {
    const topics = getTopicsAPI(media_id);
    console.log(topics);
    for (const topic of topics) {
      console.log(topic);
      const name = topic.topic.doesName + "?";
      const short_name = topic.topic.smmwDescription;
      const yes_votes = topic.yesSum;
      const no_votes = topic.noSum;
      to_return.push({topic: name, topic_short: short_name, yes_votes: yes_votes, no_votes: no_votes});
    }
  } else {
    const topics = getTopics(media_id);
    for (const topic of topics) {
      const name = topic.select('.name>a')[0].text;

      // The yesNo container is the little box which highlights red or green for a specific topic

      const yesNo = topic.select('.yesNo')[0];

      // Extract votes from the yesNo container
      const yes_votes = parseInt(yesNo.select('.yes')[0].select('.count')[0].text);
      const no_votes = parseInt(yesNo.select('.no')[0].select('.count')[0].text);
      to_return.push({topic: name, yes_votes: yes_votes, no_votes: no_votes});
    }
  }
  return to_return;
}

function search(search_string) {
  search_string = search_string.toLowerCase();
  search_string = encodeURIComponent(search_string);
  const url = 'https://www.doesthedogdie.com/search?q=' + search_string;
  if (dtdd_api_enabled) {
    const search_request = requests.get(url, {headers: api_headers});
    const resp = JSON.parse(search_request.text).items || [];
    
    if (resp.length === 0) {
      return null;
    }
    return 'media/' + (resp[0].id || '');
  } else {
    const search_request = requests.get(url, {'X-Requested-With': 'XMLHttpRequest', 'X-Note': 'I am using DoesTheDogWatchPlex without using the official API.'});
    const names = search_request.select('.name');
    let counter = 0;
    while (counter < names.length) {
      if (names[counter]['href'].includes('media/')) {
        console.log(names[counter]['href']);
        return names[counter]['href'];
      }
      counter++;
    }
  }
  return null;
}

function getInfoForMovie(movie_name, use_cache=true) {
  movie_name = movie_name.toLowerCase();
  movie_name = encodeURIComponent(movie_name);
  if (use_cache && use_memcache) {
    const data = client.get(movie_name);
    let invalid = false;
    if (data === null) {
      invalid = true;
    } else {
      try {
        const parsedData = JSON.parse(data);
        if (parsedData.time_retrieved - Date.now() > invalidation_time) {
          invalid = true;
        } else {
          data = parsedData.data;
        }
      } catch (e) {
        invalid = true;
      }
    }
  } else {
    invalid = true;
  }
  
  if (invalid || !use_cache) {
    const key = search(movie_name);
    if (key !== null) {
      const data = getInfo(key);
      if (use_memcache) {
        client.set(movie_name, JSON.stringify({data: data, time_retrieved: Date.now()}));
      }
    } else {
      data = null;
    }
  }
  return data;
}

// Listen for messages from the popup script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchWarnings") {
    const movieTitle = message.movieTitle;
    
    // Fetch trigger warnings for the movie
    const triggerWarnings = getInfoForMovie(movieTitle);
    
    // Send the trigger warnings back to the popup script
    sendResponse({ triggerWarnings });
  }
});
