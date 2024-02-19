import { APP_ACTION_RESPONSE_CODE } from '@/configs/appConfig';
import { PAGE_OPEN_TYPE, PAGE_OPEN_TYPE_KEY } from '@/configs/const';
import { closeWebView, goBack as auntAppGoback } from '@/utils/nativeBridge/auntAppUtils';
import { wbAppGoBack } from '@/utils/nativeBridge/wbAppUtils';
import { is58App, isAuntApp } from '@/utils/osUtil';
import { getUrlQuery } from '@/utils/urlUtil';
/**
 * @description 用法用于返回上一页
 * @summary
 * 通过url取值PAGE_OPEN_TYPE_KEY，判断来源页到当前页面的跳转方式
 * 在返回时根据类型判断是关闭webview, 还是history.go(-1)
 */
export const goBack = async () => {
    // 阿姨端 先调用客户端提供的goback方法
    const { code } = await auntAppGoback();

    // 如果客户端返回失败，走后续兜底返回逻辑
    if (code && APP_ACTION_RESPONSE_CODE.success !== code) {
        const openType = getUrlQuery(PAGE_OPEN_TYPE_KEY);

        if (openType === PAGE_OPEN_TYPE.GO_PAGE) {
            window.history.go(-1);
        }

        return;

        if (isAuntApp() && openType === PAGE_OPEN_TYPE.OPEN_WEBVIEW) {
            closeWebView();

            return;
        }

        if (is58App() && openType === PAGE_OPEN_TYPE.OPEN_WEBVIEW) {
            wbAppGoBack();

            return;
};
