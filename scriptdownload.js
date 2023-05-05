 const logger = {
    info: (message) => {
      console.log("[Tel Download] " + message);
    },
    error: (message) => {
      console.error("[Tel Download] " + message);
    },
  };

  const contentRangeRegex = /^bytes (\d+)-(\d+)\/(\d+)$/;

  const tel_download_video = (url) => {
    let _blobs = [];
    let _next_offset = 0;
    let _total_size = null;
    let _file_extension = "mp4";

    const fetchNextPart = () => {
      fetch(url, {
        method: "GET",
        headers: {
          Range: `bytes=${_next_offset}-`,
        },
      })
        .then((res) => {
          logger.info("get response ", res);
          if (res.status !== 206) {
            logger.error("Non 206 response was received: " + res.status);
            return;
          }

          const mime = res.headers.get("Content-Type").split(";")[0];
          if (!mime.startsWith("video/")) {
            logger.error("Get non video response with MIME type " + mime);
            throw "Get non video response with MIME type " + mime;
          }
          _file_extension = mime.split("/")[1];

          const match = res.headers
            .get("Content-Range")
            .match(contentRangeRegex);

          const startOffset = parseInt(match[1]);
          const endOffset = parseInt(match[2]);
          const totalSize = parseInt(match[3]);

          if (startOffset !== _next_offset) {
            logger.error("Gap detected between responses.");
            logger.info("Last offset: " + _next_offset);
            logger.info("New start offset " + match[1]);
            throw "Gap detected between responses.";
          }
          if (_total_size && totalSize !== _total_size) {
            logger.error("Total size differs");
            throw "Total size differs";
          }

          _next_offset = endOffset + 1;
          _total_size = totalSize;

          logger.info(
            `Get response: ${res.headers.get(
              "Content-Length"
            )} bytes data from ${res.headers.get("Content-Range")}`
          );
          logger.info(
            `Progress: ${((_next_offset * 100) / _total_size).toFixed(0)}%`
          );
          return res.blob();
        })
        .then((resBlob) => {
          _blobs.push(resBlob);
        })
        .then(() => {
          if (_next_offset < _total_size) {
            fetchNextPart();
          } else {
            save();
          }
        })
        .catch((reason) => {
          logger.error(reason);
        });
    };

    const save = () => {
      logger.info("Finish downloading blobs");
      logger.info("Concatenating blobs and downloading...");

      const fileName =
        (Math.random() + 1).toString(36).substring(2, 10) +
        "." +
        _file_extension;

      const blob = new Blob(_blobs, { type: "video/mp4" });
      const blobUrl = window.URL.createObjectURL(blob);

      logger.info("Final blob size: " + blob.size + " bytes");

      const a = document.createElement("a");
      document.body.appendChild(a);
      a.href = blobUrl;
      a.download = fileName;
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);

      logger.info("Download triggered");
    };

    fetchNextPart();
  };

  const tel_download_image = (imageUrl) => {
    const fileName =
      (Math.random() + 1).toString(36).substring(2, 10) + ".jpeg"; // assume jpeg

    const a = document.createElement("a");
    document.body.appendChild(a);
    a.href = imageUrl;
    a.download = fileName;
    a.click();
    document.body.removeChild(a);

    logger.info("Download triggered");
  };

  logger.info("Initialized");