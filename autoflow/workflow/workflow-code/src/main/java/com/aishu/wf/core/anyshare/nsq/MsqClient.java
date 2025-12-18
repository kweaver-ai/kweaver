package com.aishu.wf.core.anyshare.nsq;

import com.aishu.wf.core.anyshare.config.NsqConfig;
import aishu.cn.msq.ProtonMQClientFactory;
import cn.hutool.setting.yaml.YamlUtil;
import lombok.extern.slf4j.Slf4j;
import aishu.cn.msq.ProtonMQClient;
import org.yaml.snakeyaml.Yaml;
import javax.annotation.Resource;

import java.util.Map;
import java.util.Properties;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.Writer;
import java.io.OutputStreamWriter;

@Slf4j
public class MsqClient {
    private static ProtonMQClient mqClient;
    private static MsqClient instance;

    @Resource
    private NsqConfig nsqConfig;

    private MsqClient(NsqConfig nsqConfig) {
        ProtonMQClientFactory factory = new ProtonMQClientFactory();
        File configFile = new File("/conf/service-access/default.yaml");
        if(configFile.exists()){
            configFile = extractMQInfoFromServiceAccess(configFile.getAbsolutePath());
            if (configFile != null) {
                mqClient = factory.getProtonMQClient(configFile.getAbsolutePath());
                return;
            }
        }
       
        Properties mqConfig = new Properties();
        mqConfig.put("mqType", nsqConfig.getMqType());
        mqConfig.put("mqHost", nsqConfig.getProduceHost());
        mqConfig.put("mqPort", nsqConfig.getProducePort().toString());
        mqConfig.put("mqLookupdHost", nsqConfig.getLookupHost());
        mqConfig.put("mqLookupdPort", nsqConfig.getLookupPort() == null ? "" : nsqConfig.getLookupPort().toString());
        mqConfig.put("username", nsqConfig.getUserName() == null ? "" : nsqConfig.getUserName().toString());
        mqConfig.put("password", nsqConfig.getPassWord() == null ? "" : nsqConfig.getPassWord().toString());
        mqConfig.put("mechanism", nsqConfig.getMechanism() == null ? "" : nsqConfig.getMechanism().toString());
        mqClient = factory.getProtonMQClient(mqConfig);
    }

   public File extractMQInfoFromServiceAccess(String configFilepath) {
        File outputFile = null;
        try {
            InputStream inputStream = new FileInputStream(configFilepath);
            Yaml yaml = new Yaml();
            Map<String, Object> yamlMap = yaml.load(inputStream);
            inputStream.close();

            if (!yamlMap.containsKey("mq")) {
                return outputFile;
            }

            // 将 YAML 内容写入到指定文件路径
            String outputFilePath = "/tmp/service-access-mq.yaml";
            Writer writer = new OutputStreamWriter(new FileOutputStream(outputFilePath));
            YamlUtil.dump(yamlMap.get("mq"), writer);
            writer.close();

            // 返回表示指定文件路径的 File 对象
            outputFile = new File(outputFilePath);
        } catch (Exception e) {
            log.info("解析MQ配置文件失败", e);
        }
        return outputFile;
   }

    public static MsqClient getMsqClient(NsqConfig nsqConfig) {
        if (instance == null) {
            instance = new MsqClient(nsqConfig);
        }
        return instance;
    }

    public ProtonMQClient getProtonMQClient() {
        return mqClient;
    }
}
