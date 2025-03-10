import {
  CheckHealthData,
  CodeTestRequest,
  FeedbackRequest,
  GenerateFeedbackData,
  GenerateFeedbackError,
  TestJavascriptCodeData,
  TestJavascriptCodeError,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Brain<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   *
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  /**
   * @description Test JavaScript code against provided test cases.
   *
   * @tags dbtn/module:code_testing, dbtn/hasAuth
   * @name test_javascript_code
   * @summary Test Javascript Code
   * @request POST:/routes/test-javascript-code
   */
  test_javascript_code = (data: CodeTestRequest, params: RequestParams = {}) =>
    this.request<TestJavascriptCodeData, TestJavascriptCodeError>({
      path: `/routes/test-javascript-code`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate personalized feedback for a student based on their performance data.
   *
   * @tags dbtn/module:feedback, dbtn/hasAuth
   * @name generate_feedback
   * @summary Generate Feedback
   * @request POST:/routes/generate-feedback
   */
  generate_feedback = (data: FeedbackRequest, params: RequestParams = {}) =>
    this.request<GenerateFeedbackData, GenerateFeedbackError>({
      path: `/routes/generate-feedback`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
}
