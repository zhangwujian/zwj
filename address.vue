<template>
    <div class="or-address">
        <AppHeader :isCustomEvent="true" @on-header-left="headerLeftEvent" title="接单城市" />
        <div class="city">
            <div class="title">接单城市</div>
            <div class="city-content">
                <span class="city-name">{{cityName}}</span>
                <span @click="handleChangeCity()">
                    切换城市<img src="//img.58cdn.com.cn/arthurupload/lbg/jtfw/jtfw-a-icon-arrow-solid-right.png" class="arrow-img">
                </span>
            </div>
        </div>
        <div class="district">
            <div class="title">接单区域  <span>最多选择5个</span></div>
            <div class="cp-box">
                <div class="cp-box-top">
                    <div class="cp-box-top-left border-rit">
                        <!-- <div class="cp-box-content" :class="selectArr.length ? '' : 'cp-box-content-height'"> -->
                            <div
                                v-for="(item,index) in areaData"
                                :key="index"
                                class="cp-item"
                                :class="{'active': item.selected, 'cp-item-first': index===0 }"
                                @click="handleAreaClick(item,index)"
                            >
                                {{item.areaName}} <img src="//img.58cdn.com.cn/arthurupload/lbg/jtfw/jtfw-a-icon-location.png" v-if="currentAreaId+'' === item.areaId+''" class="location-img" />
                            </div>

                        <!-- </div> -->
                    </div>
                    <div class="cp-box-top-right">
                        <!-- <div class="cp-box-content" :class="selectArr.length ? '' : 'cp-box-content-height'"> -->
                            <div
                                v-for="(item, index) in distsData"
                                :key="index"
                                class="right-item-box"
                                :class="{'cp-item-first': index===0}"
                            >
                                <div
                                    v-show="item.py"
                                    class="cp-pinyin"
                                >{{item.py}}</div>
                                <div v-show="item.list">
                                    <div
                                        v-for="(i) in item.list"
                                        :key="i.distId"
                                        class="cp-item"
                                        :class="{'active':i.selected}"
                                        @click="handleDistClick(i)"
                                    >
                                        {{i.distName}}
                                        <img src="//img.58cdn.com.cn/arthurupload/lbg/jtfw/jtfw-a-icon-success.png" v-if="i.selected" class="success-img" />
                                    </div>
                                </div>

                            </div>
                        <!-- </div> -->
                    </div>
                </div>
            </div>
            <div class="cp-box-select" v-if="selectArr.length">
                <span class="select-title">已选({{selectArr.length}})</span>
                <span class="select-content">
                    <span  @click="handleCloseSelectArr(item)" v-for="item in selectArr" :key="item.id">{{item.name}} <img src="//img.58cdn.com.cn/arthurupload/lbg/jtfw/jtfw-a-icon-close.png" class="arrow-img"> </span>
                </span>
            </div>
            <div class="cp-box-btm">
                <span class="btn-reset" @click="handleReset">清空重选</span>
                <span class="btn-select" @click="handleConfirm">选好了（已选<span>{{selectArr.length}}</span>）</span>
            </div>
        </div>
    </div>
</template>
<script>
import { Toast } from 'vant';

import { requestGet } from '@/apis/http';
import { API_AREADISTS } from '@/apis/url';
import { getUrlQuery } from '@/utils/urlUtil';

export default {
    components: {
    },
    data() {
        return {
            cityId: '',
            cityName: '',
            auntAreaDistInfo: [],
            backfillInfo: {}, // 回填信息
            areaData: [],
            distsData: [],
            selectArr: [],
            currentAreaId: '',
        };
    },
    activated() {
        this.initPage();
    },
    methods: {
        initPage() {
            this.cityId = getUrlQuery('cityId') || '';
            this.cityName = getUrlQuery('cityName') || '';
            this.auntAreaDistInfo = getUrlQuery('auntAreaDistInfo') ? JSON.parse(getUrlQuery('auntAreaDistInfo')) : [];
            this.backfillInfo = getUrlQuery('backfillInfo') ? JSON.parse(getUrlQuery('backfillInfo')) : '';
            this.initDistInfo();
        },
        async initDistInfo() {
            try {
                const res = await requestGet(API_AREADISTS, { cityId: this.cityId });
                const { code, data, msg } = res || {};

                if (`${code}` === '0' && data) {
                    let distsArr = [];

                    this.areaData = [];
                    // 初始化或者回填数据
                    data.forEach((item) => {
                        if (this.auntAreaDistInfo.length) {
                            this.auntAreaDistInfo.forEach((select) => {
                                if (select.areaId === item.areaId) {
                                    item.selected = true;
                                    if (item.dists.length) {
                                        item.dists.forEach((dist) => {
                                            dist.list.forEach((list) => {
                                                if (select.distIds && select.distIds.length && select.distIds.includes(list.distId)) {
                                                    list.selected = true;
                                                    this.selectArr.push({
                                                        areaId: item.areaId,
                                                        distId: list.distId,
                                                        name: list.distName,
                                                    });
                                                }
                                            });
                                        });
                                    } else {
                                        this.selectArr.push({
                                            areaId: item.areaId,
                                            distId: '',
                                            name: item.areaName,
                                        });
                                    }

                                    this.currentAreaId = item.areaId;
                                    distsArr = item.dists;
                                }
                            });
                        }
                    });
                    this.areaData = data;
                    this.distsData = distsArr;
                } else {
                    Toast(`【数据异常】${msg || '获取商圈失败'}`);
                }
            } catch (e) {
                console.log(e);

                Toast(`【数据异常】${e.message || '获取商圈失败'}`);
            }
        },
        // 区域点击
        async handleAreaClick(item, index) {
            this.currentAreaId = item.areaId;
            this.distsData = this.areaData[index].dists;
            if (!item.selected) {
                item.selected = true;
                if (!item.areaId) {
                    await this.resetArea();
                    await this.resetDist();
                    this.selectArr = [];
                    item.selected = true;
                    this.selectArr.push({
                        areaId: item.areaId,
                        distId: '',
                        name: item.areaName,
                    });
                } else {
                    this.areaData[0].selected = false;
                    this.selectArr.forEach((data, i) => {
                        if (data.areaId === this.areaData[0].areaId) {
                            this.selectArr.splice(i, 1);
                        }
                    });
                    this.initAreaSelect();
                }
            }
        },
        resetArea() {
            this.areaData.forEach((item) => {
                item.selected = false;
            });
        },
        resetDist() {
            if (this.areaData.length > 0) {
                this.areaData.forEach((area) => {
                    if (area.dists.length) {
                        area.dists.forEach((dist) => {
                            if (dist.list.length) {
                                dist.list.forEach((data) => {
                                    if (data.selected) {
                                        data.selected = false;
                                    }
                                });
                            }
                        });
                    }
                });
            }
        },
        handleDistClick(dist) {
            if (dist.selected) {
                dist.selected = false;
                this.selectArr.forEach((data, index) => {
                    if (data.distId === dist.distId) {
                        this.selectArr.splice(index, 1);
                    }
                });
            } else {
                if (this.selectArr.length >= 5) {
                    Toast('最多可选择5个区域');

                    return;
                }

                dist.selected = true;
                if (dist.distId) {
                    this.selectArr.forEach((data, index) => {
                        if (this.currentAreaId === data.areaId && !data.distId) {
                            this.selectArr.splice(index, 1);
                        }
                    });
                    this.areaData.forEach((area) => {
                        if (area.areaId === this.currentAreaId) {
                            if (area.dists.length) {
                                area.dists.forEach((distVal) => {
                                    if (distVal.list.length) {
                                        distVal.list.forEach((data) => {
                                            if (!data.distId === data.selected) {
                                                data.selected = false;
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    });
                    this.selectArr.push({
                        areaId: this.currentAreaId,
                        distId: dist.distId,
                        name: dist.distName,
                    });
                } else { // 区域 -全
                    this.selectArr = this.selectArr.filter((data) => (this.currentAreaId === data.areaId && !data.distId) || this.currentAreaId !== data.areaId);
                    this.areaData.forEach((area) => {
                        if (area.areaId === this.currentAreaId) {
                            if (area.dists.length) {
                                area.dists.forEach((distVal) => {
                                    if (distVal.list.length) {
                                        distVal.list.forEach((data) => {
                                            if (data.distId === dist.distId) {
                                                data.selected = true;
                                            } else {
                                                data.selected = false;
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    });
                    this.selectArr.push({
                        areaId: this.currentAreaId,
                        distId: dist.distId,
                        name: dist.distName,
                    });
                }
            }
        },
        // 初始化区域选择
        initAreaSelect() {
            this.areaData.forEach((area) => {
                if (area.areaId !== this.currentAreaId) {
                    area.selected = false;
                    if (area.dists.length) {
                        area.dists.forEach((dist) => {
                            if (dist.list.length) {
                                dist.list.forEach((data) => {
                                    if (data.selected) {
                                        area.selected = true;
                                    }
                                });
                            }
                        });
                    }
                }
            });
        },
        handleCloseSelectArr(sItem) {
            if (sItem.distId || sItem.distId === 0) {
                this.areaData.forEach((area) => {
                    if (sItem.areaId === area.areaId) {
                        area.dists.forEach((dist) => {
                            if (dist.list.length) {
                                dist.list.forEach((data) => {
                                    if (data.distId === sItem.distId) {
                                        data.selected = false;
                                    }
                                });
                            }
                        });
                    }
                });
            } else {
                this.currentAreaId = '';
                this.areaData.forEach((area) => {
                    if (sItem.areaId === area.areaId) {
                        area.selected = false;
                    }
                });
            }

            this.initAreaSelect();

            this.selectArr.forEach((data, index) => {
                if (!data.distId) {
                    if (data.areaId === sItem.areaId) {
                        this.selectArr.splice(index, 1);
                    }
                } else if (data.distId === sItem.distId) {
                    this.selectArr.splice(index, 1);
                }
            });
        },
        async handleReset() {
            this.selectArr = [];
            this.currentAreaId = '';
            this.distsData = [];
            await this.resetArea();
            await this.resetDist();
        },
        handleChangeCity() {
            this.$router.push({
                path: '/city',
                query: {
                    cityId: this.cityId,
                    cityName: this.cityName,
                    backfillInfo: JSON.stringify(this.backfillInfo),
                },
            });
        },
        handleConfirm() {
            if (!this.selectArr.length) {
                Toast('请选想要接单的区域');

                return;
            }

            const auntAreaDistInfo = [];
            let auntAreaDistText = '';

            this.areaData.forEach((area) => {
                if (area.selected) {
                    const obj = {};

                    obj.areaId = area.areaId;
                    obj.distIds = [];
                    if (area.dists.length) {
                        area.dists.forEach((dist) => {
                            if (dist.list.length) {
                                dist.list.forEach((data) => {
                                    if (data.selected) {
                                        obj.distIds.push(data.distId);
                                        auntAreaDistText += `${data.distName}/`;
                                    }
                                });
                            }
                        });
                    } else {
                        auntAreaDistText += `${area.areaName}/`;
                    }

                    auntAreaDistInfo.push(obj);
                }
            });
            if (auntAreaDistText) {
                auntAreaDistText = auntAreaDistText.substr(0, auntAreaDistText.length - 1);
            }

            this.$router.replace({
                path: '/',
                query: {
                    queryCityId: this.cityId,
                    queryCityName: this.cityName,
                    queryAuntAreaDistText: auntAreaDistText,
                    queryAuntAreaDistInfo: JSON.stringify(auntAreaDistInfo),
                    backfillInfo: JSON.stringify(this.backfillInfo),
                    fromPage: 'auntCreateCity',
                },
            });
        },

        headerLeftEvent() {
            if (this.cityId) {
                this.$router.replace({
                    path: '/',
                    query: {
                        queryCityId: this.cityId,
                        queryCityName: this.cityName,
                        backfillInfo: JSON.stringify(this.backfillInfo),
                        fromPage: 'auntCreateCity',
                    },
                });
            } else {
                window.history.go(-1);
            }
        },
    },
};
</script>
<style lang="scss">
    .or-address{
        height: 100vh;
        display: flex;
        flex-direction: column;
        .city{
            padding:.3rem;
            background: #ffffff;
            .title{
                font-size: .4rem;
                font-weight: bold;
                color: #222222;
            }
            .city-content{
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: .32rem;
                color: #666666;
                padding: .3rem 0 0;
                .city-name{
                    color: #222222;
                    font-weight: bold;
                }
                .arrow-img{
                    height: .4rem;
                    width: .4rem;
                    display: inline-block;
                }
            }
        }
        .district {
            width: 100%;
            height: 100%;
            flex:1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background-color: #ffffff;
            margin-top: .3rem;
            .title{
                padding: 0.3rem .3rem;
                font-size: .4rem;
                font-weight: bold;
                color: #222222;
                span{
                   font-size: .32rem;
                   color: #666666;
                   font-weight: 100;
                }
            }
            .cp-box {
                flex: 1;
                overflow: hidden;
                border-top: .01rem solid #EDEDED;
                background: #fff;
                font-size: .32rem;
                .cp-box-top {
                    height: 100%;
                    display: flex;
                    overflow: hidden;
                    margin-bottom: 1.5rem;
                    .cp-box-top-left, .cp-box-top-right{
                        overscroll-behavior: contain;
                        flex: 1;
                        overflow: auto;
                        // .cp-box-content {
                        //     height: 6.5rem;
                        //     overflow: auto;
                        // }
                        // .cp-box-content-height{
                        //     height: 8rem;
                        // }
                        .right-item-box {
                            .cp-pinyin {
                                height: .3rem;
                                line-height: .3rem;
                                padding-left: .05rem;
                                background: #F7F7F7;
                                color: #222;
                            }
                            .cp-item {
                                text-align: center;
                                height: 1.5rem;
                                line-height: 1.5rem;
                                border-bottom: .01rem solid #EDEDED;
                                border-right: .01rem solid #EDEDED;
                                display: flex;
                                align-items: center;
                                padding-left: .3rem;
                                justify-content: space-between;
                                &.active {
                                    color: #00C3A8;
                                    font-weight: 500;
                                }
                                .success-img{
                                    height: .3rem;
                                    width: .3rem;
                                    margin-right: .3rem;
                                }
                            }
                        }
                        .cp-item {
                            height: 1.5rem;
                            line-height: 1.5rem;
                            text-align: center;
                            border-bottom: .01rem solid #EDEDED;
                            border-right: .01rem solid #EDEDED;
                            display: flex;
                            align-items: center;
                            padding-left: .3rem;
                            &.active {
                                color: #00C3A8;
                                font-weight: 500;
                            }
                            .location-img{
                                height: .33rem;
                                width: .28rem;
                                display: inline-block;
                                margin-left: .1rem;
                            }
                        }
                    }

                }
                .cp-box-top-margin{
                    margin-bottom: 0;
                }
            }
            .cp-box-select{
                background: #ffffff;
                display: flex;
                align-items: center;
                justify-content: space-between;
                border: .01rem solid #EDEDED;
                font-size: .32rem;
                padding:.3rem;
                .select-title{
                    display: inline-block;
                    width: 1.5rem;
                    text-align: center;
                    border-right: .01rem solid #EDEDED;
                    color: #222222;
                }
                .select-content{
                    width: 6rem;
                    overflow-x: auto;
                    overflow-y: hidden;
                    white-space:nowrap;

                    span{
                        // display: flex;
                        // align-items: center;
                        display: inline-block;
                        background: #EDFCF9;
                        height: .9rem;
                        line-height: .9rem;
                        color: #00C3A8;
                        margin: 0 .15rem;
                        border-radius: .45rem;
                        padding: 0 .3rem;
                        img{
                            height: .4rem;
                            width: .4rem;
                            display: inline-block;
                        }
                    }
                }
            }
            .cp-box-btm {
                width: 100%;
                display: flex;
                justify-content: center;;
                align-items: center;
                height: 1.4rem;
                padding: .16rem .2rem;
                border-top: .01rem solid #EDEDED;
                background: #fff;
                font-size: .4rem;
                font-weight: bold;
                .btn-reset {
                    color: #666;
                    text-align: center;
                    margin-right: .6rem;
                }
                .btn-select {
                    padding: .2rem .5rem;
                    border-radius: .12rem;
                    background: #00C3A8;
                    color: #fff;

                }
            }
        }
    }
</style>
