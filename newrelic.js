'use strict';

/**
 * New Relic agent configuration.
 *
 * See lib/config/default.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
exports.config = {
  /**
   * Array of application names.
   */
  app_name: ['Sampark-API-V83'],

  /**
   * Your New Relic license key.
   */
  license_key: '692554117ef03f9a0a87163ae6b98a4cFFFFNRAL',

  /**
   * This setting controls distributed tracing.
   * Distributed tracing lets you see the path that a request takes through your distributed system.
   */
  distributed_tracing: {
    /**
     * Enables/disables distributed tracing.
     *
     * @env NEW_RELIC_DISTRIBUTED_TRACING_ENABLED
     */
    enabled: true
  },

  application_logging: {
    forwarding: {
      enabled: true,
      max_samples_stored: 10000
    }
  },

  logging: {
    /**
     * Level at which to log. 'trace' is most useful to New Relic when diagnosing
     * issues with the agent, 'info' and higher will impose the least overhead on
     * production applications.
     */
    level: 'info',
    /**
     * Path to the log file.
     */
    filepath: 'newrelic_agent.log'
  },

  /**
   * This setting is used to ensure that the application remains instrumented by
   * the New Relic agent even when the agent is unable to connect to the New Relic
   * servers.
   */
  allow_all_headers: true,

  /**
   * Attributes allow you to collect extra information from requests
   * and store them with the transaction event.
   */
  attributes: {
    /**
     * When true, the agent captures attributes from all headers
     * except for those listed in attributes.exclude
     */
    enabled: true,
    /**
     * Prefix of headers to exclude from capture.
     */
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*'
    ]
  }
};