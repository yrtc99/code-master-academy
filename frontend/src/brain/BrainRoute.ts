import {
  CheckHealthData,
  CodeTestRequest,
  FeedbackRequest,
  GenerateFeedbackData,
  TestJavascriptCodeData,
} from "./data-contracts";

export namespace Brain {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthData;
  }

  /**
   * @description Test JavaScript code against provided test cases.
   * @tags dbtn/module:code_testing, dbtn/hasAuth
   * @name test_javascript_code
   * @summary Test Javascript Code
   * @request POST:/routes/test-javascript-code
   */
  export namespace test_javascript_code {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CodeTestRequest;
    export type RequestHeaders = {};
    export type ResponseBody = TestJavascriptCodeData;
  }

  /**
   * @description Generate personalized feedback for a student based on their performance data.
   * @tags dbtn/module:feedback, dbtn/hasAuth
   * @name generate_feedback
   * @summary Generate Feedback
   * @request POST:/routes/generate-feedback
   */
  export namespace generate_feedback {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = FeedbackRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateFeedbackData;
  }
}
