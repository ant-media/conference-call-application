package io.antmedia.rest;

import com.google.gson.Gson;
import io.antmedia.AntMediaApplicationAdapter;
import io.antmedia.rest.model.Version;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.jar.Manifest;

@Component
@Path("/circle")
public class ConferenceRestService {

	private static final Logger logger = LoggerFactory.getLogger(ConferenceRestService.class);

	Gson gson = new Gson();


	@GET
	@Path("/version")
	@Produces(MediaType.APPLICATION_JSON)
	public String getVersion() {
		return gson.toJson(getSoftwareVersion());
	}


    public Version getSoftwareVersion() {
		Version version = new Version();

		URL url = null;

		Class<ConferenceRestService> clazz = ConferenceRestService.class;
		String className = clazz.getSimpleName() + ".class";
		String classPath = clazz.getResource(className).toString();
		String manifestPath = classPath.substring(0, classPath.lastIndexOf("/WEB-INF")) +
				"/META-INF/MANIFEST.MF";

		try {
			url = new URL(manifestPath);
		} catch (MalformedURLException e) {
			logger.error(e.getMessage());
		}

		Manifest manifest;

		try {
			if (url != null)
			{
				manifest = new Manifest(url.openStream());
				String versionName = manifest.getMainAttributes().getValue("Implementation-Build");
				String buildNumber = manifest.getMainAttributes().getValue("Build-Number");
				version.setVersionName(versionName);
				version.setBuildNumber(buildNumber);
			}
			else {
				logger.error("url(META-INF/MANIFEST.MF) is null when getting software version");
			}
		} catch (IOException e) {
			logger.error(e.getMessage());
		}

		version.setVersionType("Circle");

		logger.info("Version Name {} Version Type {}", version.getVersionName(), version.getVersionType());
		return version;
	}
}