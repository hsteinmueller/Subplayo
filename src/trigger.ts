/**
 * Creates two time-driven triggers.
 * @see https://developers.google.com/apps-script/guides/triggers/installable#time-driven_triggers
 */
function createTimeDrivenTriggers() {
  // Trigger every 6 hours.
  ScriptApp.newTrigger('myFunction').timeBased().atHour(0).create();
}
