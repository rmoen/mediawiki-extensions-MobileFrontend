Feature: Image Resolves to the correct place

  Scenario: Image link resolves
    Given I am on the Barack_Obama article
     When I expand Presidential Campaign Section
     When I click on this image
     Then I go to the image's page