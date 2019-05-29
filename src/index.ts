// https://developers.google.com/analytics/devguides/collection/gtagjs/
export type GTagLib = (op: string, arg: string | Date, args?: {}) => void;

declare global {
  // tslint:disable-next-line interface-name
  interface Window {
    gtag: GTagLib;
  }
}

export interface IGALocalization {
  currency?: string;
  country?: string;
}

export interface IGAAppConfig {
  app_name: string;
  app_id?: string;
  app_version?: string;
  app_installer_id?: string;
}

export type GAEventAction =
  | 'add_payment_info'
  | 'add_to_cart'
  | 'add_to_wishlist'
  | 'begin_checkout'
  | 'checkout_progress'
  | 'generate_lead'
  | 'login'
  | 'purchase'
  | 'refund'
  | 'remove_from_cart'
  | 'search'
  | 'select_content'
  | 'set_checkout_option'
  | 'share'
  | 'sign_up'
  | 'view_item'
  | 'view_item_list'
  | 'view_promotion'
  | 'view_search_results';

export type GAEventCategory = 'engagement' | 'ecommerce';

export type GAEventLabel = 'method' | 'search_term' | 'content_type';

export interface IGAEventOptions {
  [key: string]: any;
  content_type?: string;
  method?: string;
  non_interaction?: boolean;
  search_term?: string;
  select_content?: string;
  value?: number;
  items?: [
    {
      id: string;
      [key: string]: any;
    }
  ];
}

export interface IGATagOptions {
  eventTimeout: number;
}

export class GTag<
  Action extends string = GAEventAction,
  Category extends string = GAEventCategory,
  Label extends string = GAEventLabel
> {
  public appConfigured = false;
  public options: IGATagOptions;

  constructor(
    public gtag: GTagLib | null,
    public trackingId: string,
    options?: Partial<IGATagOptions>
  ) {
    this.options = {
      eventTimeout: 5000,
      ...options,
    };
  }

  public init(sendPageView = true, appConfig?: IGAAppConfig): void {
    const { gtag, trackingId } = this;
    if (gtag) {
      // https://developers.google.com/analytics/devguides/collection/gtagjs/
      gtag('js', new Date());
      gtag('config', trackingId, { send_page_view: sendPageView });
      if (appConfig) {
        this.setAppConfig(appConfig);
      }
    }
  }

  public setAppConfig(config: IGAAppConfig): void {
    this.appConfigured = true;
    const { gtag, trackingId } = this;
    if (gtag) {
      gtag('config', trackingId, config);
    }
  }

  public setUserId(uid: string): void {
    const { gtag, trackingId } = this;
    if (gtag) {
      gtag('config', trackingId, { user_id: uid });
    }
  }

  public setLocalization(info: IGALocalization): void {
    const { gtag, trackingId } = this;
    if (gtag) {
      // https://developers.google.com/analytics/devguides/collection/gtagjs/setting-values
      gtag('config', trackingId, info);
    }
  }

  public sendPageView(path?: string): void {
    const { gtag, trackingId } = this;
    if (gtag && typeof window !== 'undefined') {
      // https://developers.google.com/analytics/devguides/collection/gtagjs/pages
      gtag('config', trackingId, {
        page_title: window.document.title,
        page_location: window.location.href,
        page_path: path,
      });
    }
  }

  public sendScreenView(screenName: string): void {
    const { gtag } = this;
    if (gtag) {
      if (!this.appConfigured) {
        throw new Error('call setAppConfig() first');
      }
      // https://developers.google.com/analytics/devguides/collection/gtagjs/screens
      gtag('event', 'screen_view', { screen_name: screenName });
    }
  }

  public sendEvent(
    action: Action,
    category: Category,
    label: Label,
    options?: IGAEventOptions
  ): Promise<void> {
    return new Promise(
      (resolve, reject): void => {
        const { gtag } = this;
        if (gtag) {
          // https://developers.google.com/analytics/devguides/collection/gtagjs/events
          gtag('event', action, {
            event_category: category,
            event_label: label,
            ...options,
            event_callback: resolve,
          });
          setTimeout(
            () => reject(new Error('timeout')),
            this.options.eventTimeout
          );
        } else {
          reject(new Error('gtag not set'));
        }
      }
    );
  }

  public sendException(description: string, fatal = true, info?: {}): void {
    const { gtag } = this;
    if (gtag) {
      // https://developers.google.com/analytics/devguides/collection/gtagjs/exceptions
      gtag('event', 'exception', {
        description,
        fatal,
        ...info,
      });
    }
  }

  public sendError(e: any, fatal = false, info?: {}): void {
    const { gtag } = this;
    if (gtag) {
      const props: { [key: string]: any } = {};
      if (e != null) {
        if (typeof e === 'string' && e) {
          props.message = e;
        }
        if (typeof e === 'number') {
          props.code = e;
        }
        if (e.message) {
          props.message = e.message;
        }
        if (e.error != null) {
          props.error = e.error;
        }
        if (e.code != null) {
          props.code = e.code;
        }
        if (e.name) {
          props.name = e.name;
        }
        if (e.stack) {
          props.stack = e.stack;
        }
      }

      this.sendException(JSON.stringify(props), fatal, info);
    }
  }
}
