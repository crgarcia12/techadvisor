Feature: Chat-driven, web-crawled product comparison in TechAdvisor

  Background:
    Given the TechAdvisor app is running
    And I open the app in a browser
    Then I see a chat pane and a comparison table pane

  Scenario: Assistant narrows the product category
    When I type "I want a TV" in the chat and send it
    Then the assistant replies with a question mentioning "inches"

  Scenario: Adding a product shows the researching indicator
    Given the assistant has asked about screen size
    When I add a product with url "https://www.example.com/tv/samsung-55-qled" and price "799"
    Then a new column for that product appears in the comparison table
    And the product column shows an animated magnifying-glass researching indicator

  Scenario: Crawled specifications and price populate the table
    Given I added a product with url "https://www.example.com/tv/samsung-55-qled" and price "799"
    When the research for that product completes
    Then the magnifying-glass indicator is no longer shown for that product
    And the comparison table shows a "Resolution" row with a value for that product
    And the comparison table shows the price "799" for that product

  Scenario: Missing metrics are omitted, not fabricated
    Given I added a product with url "https://www.example.com/tv/no-contrast-listed" and price "650"
    When the research for that product completes
    And the crawler did not find a "Contrast Ratio" value on the page
    Then the comparison table does not show a "Contrast Ratio" value for that product

  Scenario: Second product updates the table live
    Given I added a product with url "https://www.example.com/tv/samsung-55-qled" and price "799"
    And its research has completed
    When I add a product with url "https://www.example.com/tv/lg-55-oled" and price "999"
    Then a second product column appears without a full page reload
    And shared metrics such as "Resolution" align in the same row for both products

  Scenario: Graceful handling when Azure AI Foundry is not configured
    Given the app is started without Azure AI Foundry credentials
    When I open the app and type "I want a TV" and send it
    Then I see a clear message stating that the Azure AI Foundry configuration is missing
    And the app remains usable without crashing
