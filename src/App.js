import React, { useState } from 'react';
import axios from 'axios';
import "./App.css";

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [descriptions, setDescriptions] = useState({}); // To hold descriptions for multiple results

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setError(''); // Clear error state before new search
    setResults([]);
    setDescriptions({}); // Clear previous descriptions

    try {
      // Fetch search results from the backend
      const response = await axios.post('http://94.130.58.212:8081/query', { query });
      const fetchedResults = response.data;

      if (fetchedResults.length > 0) {
        setResults(fetchedResults.slice(0, 10)); // Display at most 10 results

        // Fetch descriptions for each result
        const descriptionPromises = fetchedResults.slice(0, 10).map(async (result) => {
          const [resultTitle, data] = Object.entries(result)[0];
          const pageSnippet = await parsePageContent(data.url);
          return { title: resultTitle, url: data.url, description: pageSnippet };
        });

        const descriptionsArray = await Promise.all(descriptionPromises);
        const descriptionsObject = descriptionsArray.reduce((acc, { title, url, description }) => {
          acc[title] = { url, description };
          return acc;
        }, {});
        
        setDescriptions(descriptionsObject);
        
      } else {
        setError('No results found.');
      }
    } catch (error) {
      setError('Error fetching results.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const parsePageContent = async (url) => {
    try {
      // Make a POST request to the backend endpoint with the URL in the body
      const response = await axios.post('http://94.130.58.212:8081/scrape_link', { query: url });

      // Get the response from the backend
      const scrapedContent = response.data;
      return scrapedContent || 'No content found.';
    } catch (error) {
      console.error('Error fetching page content:', error);
      return 'Unable to fetch content.';
    }
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search the web"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-button">Search</button>
      </form>

      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error">{error}</div>}
      {results.length === 0 && !loading && !error && <div className="no-results">No results to display.</div>}

      <div className="results">
        {results.length > 0 && results.map((result) => {
          const [resultTitle] = Object.entries(result)[0];
          const { url, description } = descriptions[resultTitle] || {};
          
          return (
            <div key={url} className="result-item">
              <h3><a href={url} target="_blank" rel="noopener noreferrer">{resultTitle}</a></h3>
              <p>{description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Search;
