import mapboxgl from 'mapbox-gl';


const apiEndpoint = 'https://wuhan-coronavirus-api.laeyoung.endpoint.ainize.ai';

async function getData() {
  const response = await fetch(`${apiEndpoint}/jhu-edu/latest`);
  return await response.json();
}

mapboxgl.accessToken = 'pk.eyJ1Ijoic2lyb2RpYXoiLCJhIjoiY2s4Z2Y1ZWRrMDByNTNtbXp3eXp2YmhreCJ9.h7aMotOX5GYgB6IqjQ33UA';
let map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v10',
  center: [0, 0],
  zoom: 1,
  maxZoom: 3,
});

let markers = [];

function getGlobalConfirmedCases(countries) {
  let total = 0;

  for (let i = 0; i < countries.length; i++) {
    if (countries[i].confirmed) {
      total += countries[i].confirmed;
    }
  }

  return total;
}

function getMarkerSize(totalConfirmed, confirmed, maxSize, minSize) {
  const percentage = (confirmed * 100) / totalConfirmed;
  const realSize = maxSize - minSize;
  const size = (realSize * percentage) / 100;

  return size + minSize;
}

function getUnifiedCountryRegions(countries) {
  const uniqueCountries = new Map();

  countries.forEach(country => {
    const countryName = country.countryregion;
    if (uniqueCountries.has(countryName)) {
      if (country.confirmed) {
        let uniqCountry = uniqueCountries.get(countryName);

        uniqCountry.confirmed += country.confirmed;
        uniqCountry.deaths += country.deaths;
        uniqCountry.recovered += country.recovered;
        uniqueCountries.location = country.location;

        uniqueCountries.set(countryName, uniqCountry);
      }
    } else {
      console.log(country.countryregion, country);
      uniqueCountries.set(countryName, country);
    }
  });

  return uniqueCountries;
}

async function init() {
  try {
    const globalAffections = await getData();
    const countries = globalAffections;
    const globalCases = getGlobalConfirmedCases(globalAffections);
    
    countries.forEach(country => {
      const {countryregion, provincestate, confirmed, deaths, recovered} = country;
      const {lat, lng} = country.location;

      if (confirmed > 0) {
        // create the popup
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<h1>${countryregion}</h1>
           <h3>${provincestate}</h3>
           <p>Casos confirmados: ${confirmed}<br/>
           Muertes: ${deaths || 0}<br/>
           Recuperados: ${recovered || 0}</p>`
        );

        // create DOM element for the marker
        let size = getMarkerSize(globalCases, confirmed, 150, 10);
        let el = document.createElement('div');
        
        el.classList.add('marker');
        el.style.width = size + 'px';
        el.style.height = size + 'px';
        
        // create the marker
        let marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(popup) // sets a popup on this marker
          .addTo(map);
        
        markers.push(marker);
      }
    });
  } catch (e) {
    console.log(e.message);
  }
}

init();